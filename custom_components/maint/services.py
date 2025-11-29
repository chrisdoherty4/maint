"""Maint service registration and handlers."""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.util import dt as dt_util

from .domain import DOMAIN

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

    from homeassistant.core import HomeAssistant, ServiceCall

    from .models import MaintTaskStore

SERVICE_RESET_LAST_COMPLETED = "reset_last_completed"
SERVICE_TARGET_GROUP = "task_target"
SERVICE_ENTITY_ID = "entity_id"
SERVICE_ENTRY_ID = "entry_id"
SERVICE_TASK_ID = "task_id"
SERVICE_LAST_COMPLETED = "last_completed"
SERVICE_RESET_LAST_COMPLETED_SCHEMA = vol.Schema(
    {
        vol.Exclusive(SERVICE_ENTITY_ID, SERVICE_TARGET_GROUP): cv.entity_id,
        vol.Inclusive(SERVICE_ENTRY_ID, SERVICE_TARGET_GROUP): cv.string,
        vol.Inclusive(SERVICE_TASK_ID, SERVICE_TARGET_GROUP): cv.string,
        vol.Optional(SERVICE_LAST_COMPLETED): cv.date,
    },
    extra=vol.PREVENT_EXTRA,
)

_LOGGER = logging.getLogger(__name__)

DATA_KEY_SERVICES_REGISTERED = "services_registered"


def _normalize_last_completed(value: date | datetime | None) -> date:
    """Convert service input into a date, defaulting to today."""
    if value is None:
        return dt_util.now().date()
    if isinstance(value, datetime):
        return dt_util.as_local(value).date()
    return value


def _resolve_service_target(
    hass: HomeAssistant, data: dict[str, Any]
) -> tuple[str, str]:
    """Return entry and task identifiers from service data."""
    if entity_id := data.get(SERVICE_ENTITY_ID):
        state = hass.states.get(entity_id)
        if state is None:
            message = f"Entity {entity_id} not found"
            raise HomeAssistantError(message)
        entry_id = state.attributes.get("entry_id")
        task_id = state.attributes.get("task_id")
        if not entry_id or not task_id:
            message = f"Entity {entity_id} is not a Maint task sensor"
            raise HomeAssistantError(message)
        return str(entry_id), str(task_id)

    entry_id = data[SERVICE_ENTRY_ID]
    task_id = data[SERVICE_TASK_ID]
    return str(entry_id), str(task_id)


def async_register_services(
    hass: HomeAssistant,
    get_task_store: Callable[[HomeAssistant], Awaitable[MaintTaskStore]],
) -> None:
    """Register Maint services."""
    data: dict[str, Any] = hass.data.setdefault(DOMAIN, {})
    if data.get(DATA_KEY_SERVICES_REGISTERED):
        return

    async def async_handle_reset_last_completed(call: ServiceCall) -> None:
        """Set a task's last completed date."""
        entry_id, task_id = _resolve_service_target(hass, call.data)
        last_completed = _normalize_last_completed(
            call.data.get(SERVICE_LAST_COMPLETED)
        )
        store = await get_task_store(hass)
        try:
            await store.async_set_last_completed(
                entry_id, task_id, last_completed=last_completed
            )
        except KeyError as err:
            message = f"Task {task_id} not found for entry {entry_id}"
            raise HomeAssistantError(message) from err

    hass.services.async_register(
        DOMAIN,
        SERVICE_RESET_LAST_COMPLETED,
        async_handle_reset_last_completed,
        schema=SERVICE_RESET_LAST_COMPLETED_SCHEMA,
    )
    data[DATA_KEY_SERVICES_REGISTERED] = True
    _LOGGER.debug("Registered Maint services")
