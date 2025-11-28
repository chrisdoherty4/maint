"""Websocket handlers for Maint administrative APIs."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import callback
from homeassistant.helpers import config_validation as cv

from .domain import DOMAIN
from .models import (
    FREQUENCY_UNIT_DAYS,
    FREQUENCY_UNIT_MONTHS,
    FREQUENCY_UNIT_WEEKS,
    FREQUENCY_UNITS,
    MaintConfigEntry,
    MaintRuntimeData,
    MaintTaskStore,
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

TASK_FREQUENCY_KEY = "frequency"
TASK_FREQUENCY_VALIDATION = cv.positive_int
TASK_FREQUENCY_UNIT_KEY = "frequency_unit"
TASK_FREQUENCY_UNIT_VALIDATION = vol.In(FREQUENCY_UNITS)

TASK_LAST_COMPLETED_KEY = "last_completed"
TASK_LAST_COMPLETED_VALIDATION = cv.date


@callback
def async_register_websocket_handlers(hass: HomeAssistant) -> None:
    """Register websocket commands for Maint."""
    _LOGGER.debug("Registering Maint websocket commands")
    websocket_api.async_register_command(hass, websocket_list_tasks)
    websocket_api.async_register_command(hass, websocket_create_task)
    websocket_api.async_register_command(hass, websocket_update_task)
    websocket_api.async_register_command(hass, websocket_delete_task)


def _convert_frequency_to_days(frequency: int, unit: str) -> int:
    """Normalize a frequency value into days for storage."""
    if unit == FREQUENCY_UNIT_WEEKS:
        return frequency * 7
    if unit == FREQUENCY_UNIT_MONTHS:
        return frequency * 30
    return frequency


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
    connection.send_result(msg["id"], [task.to_dict() for task in tasks])


@websocket_api.websocket_command(
    {
        vol.Required(WS_TYPE_KEY): WS_TYPE_TASK_CREATE,
        vol.Required(TASK_ENTRY_ID_KEY): TASK_ENTRY_ID_VALIDATION,
        vol.Required(TASK_DESCRIPTION_KEY): TASK_DESCRIPTION_VALIDATION,
        vol.Required(TASK_FREQUENCY_KEY): TASK_FREQUENCY_VALIDATION,
        vol.Optional(
            TASK_FREQUENCY_UNIT_KEY, default=FREQUENCY_UNIT_DAYS
        ): TASK_FREQUENCY_UNIT_VALIDATION,
        vol.Required(TASK_LAST_COMPLETED_KEY): TASK_LAST_COMPLETED_VALIDATION,
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
    frequency_unit = msg[TASK_FREQUENCY_UNIT_KEY]
    frequency = _convert_frequency_to_days(msg[TASK_FREQUENCY_KEY], frequency_unit)
    task = await store.async_create_task(
        entry.entry_id,
        description=msg[TASK_DESCRIPTION_KEY],
        last_completed=msg[TASK_LAST_COMPLETED_KEY],
        frequency=frequency,
        frequency_unit=frequency_unit,
    )
    connection.send_result(msg["id"], task.to_dict())
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
        vol.Required(TASK_FREQUENCY_KEY): TASK_FREQUENCY_VALIDATION,
        vol.Optional(
            TASK_FREQUENCY_UNIT_KEY, default=FREQUENCY_UNIT_DAYS
        ): TASK_FREQUENCY_UNIT_VALIDATION,
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
    frequency_unit = msg[TASK_FREQUENCY_UNIT_KEY]
    frequency = _convert_frequency_to_days(msg[TASK_FREQUENCY_KEY], frequency_unit)

    try:
        task = await store.async_update_task(
            entry.entry_id,
            task_id,
            description=description,
            last_completed=last_completed,
            frequency=frequency,
            frequency_unit=frequency_unit,
        )
    except KeyError:
        _LOGGER.debug(
            "Task %s not found for Maint entry %s during websocket update",
            task_id,
            entry.entry_id,
        )
        connection.send_error(msg["id"], "task_not_found", f"Task {task_id} not found")
        return

    connection.send_result(msg["id"], task.to_dict())
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
    connection.send_result(msg["id"], task.to_dict())
    _LOGGER.debug(
        "Websocket deleted Maint task %s for entry %s", task.task_id, entry.entry_id
    )
