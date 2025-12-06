"""Websocket handlers for Maint administrative APIs."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.util import slugify

from .domain import DOMAIN
from .models import (
    MaintConfigEntry,
    MaintRuntimeData,
    MaintTask,
    MaintTaskStore,
    Recurrence,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

WS_TYPE_KEY = "type"
WS_TYPE_TASK_CREATE = "maint/task/create"
WS_TYPE_TASK_DELETE = "maint/task/delete"
WS_TYPE_TASK_UPDATE = "maint/task/update"
WS_TYPE_TASK_LIST = "maint/task/list"


def _validated_description(value: Any) -> str:
    """Validate task descriptions are non-empty after trimming whitespace."""
    description = cv.string(value).strip()
    if not description:
        message = "description_required"
        raise vol.Invalid(message)
    return description


TASK_ENTRY_ID_KEY = "entry_id"
TASK_ENTRY_ID_VALIDATION = cv.string

TASK_ID_KEY = "task_id"
TASK_ID_VALIDATION = cv.string

TASK_DESCRIPTION_KEY = "description"
TASK_DESCRIPTION_VALIDATION = _validated_description

TASK_LAST_COMPLETED_KEY = "last_completed"
TASK_LAST_COMPLETED_VALIDATION = cv.date
TASK_RECURRENCE_KEY = "recurrence"
TASK_ICON_KEY = "icon"
TASK_ICON_VALIDATION = vol.Any(None, cv.string)

RECURRENCE_TYPE = vol.In(["interval", "weekly"])

WEEKDAY_VALIDATION = vol.All(int, vol.Range(min=0, max=6))
RECURRENCE_VALIDATION = vol.Any(
    vol.Schema(
        {
            vol.Required("type"): "interval",
            vol.Required("every"): cv.positive_int,
            vol.Required("unit"): vol.In(["days", "weeks", "months"]),
        },
        extra=vol.PREVENT_EXTRA,
    ),
    vol.Schema(
        {
            vol.Required("type"): "weekly",
            vol.Optional("every", default=1): cv.positive_int,
            vol.Required("days"): vol.All([WEEKDAY_VALIDATION], vol.Length(min=1)),
        },
        extra=vol.PREVENT_EXTRA,
    ),
)


@callback
def async_register_websocket_handlers(hass: HomeAssistant) -> None:
    """Register websocket commands for Maint."""
    _LOGGER.debug("Registering Maint websocket commands")
    websocket_api.async_register_command(hass, websocket_list_tasks)
    websocket_api.async_register_command(hass, websocket_create_task)
    websocket_api.async_register_command(hass, websocket_update_task)
    websocket_api.async_register_command(hass, websocket_delete_task)


def _resolve_task_store(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> tuple[MaintTaskStore, MaintConfigEntry] | None:
    """Return the task store for a config entry."""
    request_id = msg["id"]
    entry_id = msg[TASK_ENTRY_ID_KEY]
    command = msg.get(WS_TYPE_KEY, "unknown")
    entry = hass.config_entries.async_get_entry(entry_id)

    if entry is None or entry.domain != DOMAIN:
        _LOGGER.warning("Websocket request for unknown Maint entry %s", entry_id)
        connection.send_error(
            request_id,
            "entry_not_found",
            f"Entry {entry_id} not found",
        )
        return None

    if entry.state is not ConfigEntryState.LOADED:
        _LOGGER.debug(
            "Maint entry %s not loaded for websocket request %s",
            entry_id,
            command,
        )
        connection.send_error(
            request_id, "entry_not_loaded", f"Entry {entry_id} is not loaded"
        )
        return None

    runtime_data = entry.runtime_data
    if not isinstance(runtime_data, MaintRuntimeData):
        _LOGGER.warning("Runtime data missing for Maint entry %s", entry_id)
        connection.send_error(
            request_id,
            "runtime_data_missing",
            f"Entry {entry_id} has no runtime data",
        )
        return None

    return runtime_data.task_store, entry  # MaintRuntimeData ensures store availability


def _parse_recurrence(raw: dict[str, Any]) -> Recurrence:
    """Convert validated recurrence data into a Recurrence object."""
    return Recurrence.from_dict(raw)


def _normalized_icon(raw: str | None) -> str | None:
    """Return a trimmed icon string or None when empty/absent."""
    if raw is None:
        return None
    icon = raw.strip()
    return icon if icon else None


def _task_icon(hass: HomeAssistant, entry_id: str, task_id: str) -> str | None:
    """Return the icon configured for a task's binary sensor."""
    registry = er.async_get(hass)
    unique_id = f"{entry_id}_{task_id}"
    entity_id = registry.async_get_entity_id("binary_sensor", DOMAIN, unique_id)
    if entity_id is None:
        return None
    entity_entry = registry.async_get(entity_id)
    return entity_entry.icon if entity_entry else None


def _task_response(
    hass: HomeAssistant, entry: MaintConfigEntry, task: MaintTask
) -> dict[str, Any]:
    """Return websocket response payload including the current icon."""
    data = task.to_dict()
    data[TASK_ICON_KEY] = _task_icon(hass, entry.entry_id, task.task_id)
    return data


def _apply_icon(
    hass: HomeAssistant,
    entry: MaintConfigEntry,
    task_id: str,
    description: str,
    icon: str | None,
) -> None:
    """Persist a task's icon to the entity registry."""
    registry = er.async_get(hass)
    unique_id = f"{entry.entry_id}_{task_id}"
    suggested_object_id = slugify(f"{entry.title}_{description}")
    entity_entry = registry.async_get_or_create(
        "binary_sensor",
        DOMAIN,
        unique_id,
        suggested_object_id=suggested_object_id,
        config_entry=entry,
    )
    entity_id = entity_entry.entity_id
    if entity_id is None:
        entity_id = registry.async_get_entity_id("binary_sensor", DOMAIN, unique_id)
    if entity_id and entity_entry.icon != icon:
        registry.async_update_entity(entity_id, icon=icon)


@websocket_api.websocket_command(
    {
        vol.Required(WS_TYPE_KEY): WS_TYPE_TASK_LIST,
        vol.Required(TASK_ENTRY_ID_KEY): TASK_ENTRY_ID_VALIDATION,
    }
)
@websocket_api.async_response
async def websocket_list_tasks(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """List tasks for a Maint config entry."""
    resolved = _resolve_task_store(hass, connection, msg)
    if resolved is None:
        return

    store, entry = resolved
    tasks = await store.async_list_tasks(entry.entry_id)
    _LOGGER.debug(
        "Websocket list tasks for Maint entry %s: %s tasks",
        entry.entry_id,
        len(tasks),
    )
    connection.send_result(
        msg["id"], [_task_response(hass, entry, task) for task in tasks]
    )


@websocket_api.websocket_command(
    {
        vol.Required(WS_TYPE_KEY): WS_TYPE_TASK_CREATE,
        vol.Required(TASK_ENTRY_ID_KEY): TASK_ENTRY_ID_VALIDATION,
        vol.Required(TASK_DESCRIPTION_KEY): TASK_DESCRIPTION_VALIDATION,
        vol.Required(TASK_LAST_COMPLETED_KEY): TASK_LAST_COMPLETED_VALIDATION,
        vol.Required(TASK_RECURRENCE_KEY): RECURRENCE_VALIDATION,
        vol.Optional(TASK_ICON_KEY): TASK_ICON_VALIDATION,
    }
)
@websocket_api.async_response
async def websocket_create_task(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Create a new maintenance task."""
    resolved = _resolve_task_store(hass, connection, msg)
    if resolved is None:
        return

    store, entry = resolved
    recurrence = _parse_recurrence(msg[TASK_RECURRENCE_KEY])
    icon_provided = TASK_ICON_KEY in msg
    icon = _normalized_icon(msg.get(TASK_ICON_KEY) if icon_provided else None)
    task = await store.async_create_task(
        entry.entry_id,
        description=msg[TASK_DESCRIPTION_KEY],
        last_completed=msg[TASK_LAST_COMPLETED_KEY],
        recurrence=recurrence,
    )
    if icon_provided:
        _apply_icon(hass, entry, task.task_id, task.description, icon)
    connection.send_result(msg["id"], _task_response(hass, entry, task))
    _LOGGER.debug(
        "Websocket created Maint task %s for entry %s",
        task.task_id,
        entry.entry_id,
    )


@websocket_api.websocket_command(
    {
        vol.Required(WS_TYPE_KEY): WS_TYPE_TASK_UPDATE,
        vol.Required(TASK_ENTRY_ID_KEY): TASK_ENTRY_ID_VALIDATION,
        vol.Required(TASK_ID_KEY): TASK_ID_VALIDATION,
        vol.Required(TASK_DESCRIPTION_KEY): TASK_DESCRIPTION_VALIDATION,
        vol.Required(TASK_LAST_COMPLETED_KEY): TASK_LAST_COMPLETED_VALIDATION,
        vol.Required(TASK_RECURRENCE_KEY): RECURRENCE_VALIDATION,
        vol.Optional(TASK_ICON_KEY): TASK_ICON_VALIDATION,
    }
)
@websocket_api.async_response
async def websocket_update_task(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Update an existing task."""
    resolved = _resolve_task_store(hass, connection, msg)
    if resolved is None:
        return
    store, entry = resolved
    task_id = msg[TASK_ID_KEY]
    last_completed = msg[TASK_LAST_COMPLETED_KEY]
    description = msg[TASK_DESCRIPTION_KEY]
    recurrence = _parse_recurrence(msg[TASK_RECURRENCE_KEY])
    icon_provided = TASK_ICON_KEY in msg
    icon = _normalized_icon(msg.get(TASK_ICON_KEY) if icon_provided else None)

    try:
        task = await store.async_update_task(
            entry.entry_id,
            task_id,
            description=description,
            last_completed=last_completed,
            recurrence=recurrence,
        )
    except KeyError:
        _LOGGER.debug(
            "Task %s not found for Maint entry %s during websocket update",
            task_id,
            entry.entry_id,
        )
        connection.send_error(msg["id"], "task_not_found", f"Task {task_id} not found")
        return

    if icon_provided:
        _apply_icon(hass, entry, task.task_id, task.description, icon)

    connection.send_result(msg["id"], _task_response(hass, entry, task))
    _LOGGER.debug(
        "Websocket updated Maint task %s for entry %s", task.task_id, entry.entry_id
    )


@websocket_api.websocket_command(
    {
        vol.Required(WS_TYPE_KEY): WS_TYPE_TASK_DELETE,
        vol.Required(TASK_ENTRY_ID_KEY): TASK_ENTRY_ID_VALIDATION,
        vol.Required(TASK_ID_KEY): TASK_ID_VALIDATION,
    }
)
@websocket_api.async_response
async def websocket_delete_task(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Delete a maintenance task."""
    resolved = _resolve_task_store(hass, connection, msg)
    if resolved is None:
        return
    store, entry = resolved
    task_id = msg[TASK_ID_KEY]
    try:
        task = await store.async_delete_task(entry.entry_id, task_id)
    except KeyError:
        _LOGGER.debug(
            "Task %s not found for Maint entry %s during websocket delete",
            task_id,
            entry.entry_id,
        )
        connection.send_error(msg["id"], "task_not_found", f"Task {task_id} not found")
        return
    connection.send_result(msg["id"], _task_response(hass, entry, task))
    _LOGGER.debug(
        "Websocket deleted Maint task %s for entry %s", task.task_id, entry.entry_id
    )
