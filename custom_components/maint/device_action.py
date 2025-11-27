"""Device actions for Maint."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Final

import voluptuous as vol
from homeassistant.components.device_automation import async_validate_entity_schema
from homeassistant.components.device_automation.const import CONF_ENTITY_ID
from homeassistant.components.device_automation.exceptions import (
    InvalidDeviceAutomationConfig,
)
from homeassistant.const import CONF_DEVICE_ID, CONF_DOMAIN, CONF_TYPE
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .models import MaintRuntimeData, MaintTaskStore

if TYPE_CHECKING:
    from homeassistant.core import Context, HomeAssistant
    from homeassistant.helpers.typing import ConfigType, TemplateVarsType

ACTION_TYPE_MARK_COMPLETE: Final = "mark_complete"
_LOGGER = logging.getLogger(__name__)

_ACTION_SCHEMA: Final = cv.DEVICE_ACTION_BASE_SCHEMA.extend(
    {
        vol.Required(CONF_TYPE): vol.In({ACTION_TYPE_MARK_COMPLETE}),
        vol.Required(CONF_ENTITY_ID): cv.entity_id_or_uuid,
    }
)


async def async_validate_action_config(
    hass: HomeAssistant, config: ConfigType
) -> ConfigType:
    """Validate a Maint device action."""
    return async_validate_entity_schema(hass, config, _ACTION_SCHEMA)


async def async_get_actions(
    hass: HomeAssistant, device_id: str
) -> list[dict[str, str]]:
    """List Maint device actions for a device."""
    registry = er.async_get(hass)
    actions: list[dict[str, str]] = []

    for entry in er.async_entries_for_device(registry, device_id):
        if entry.domain != "binary_sensor" or entry.platform != DOMAIN:
            continue

        actions.append(
            {
                CONF_DEVICE_ID: device_id,
                CONF_DOMAIN: DOMAIN,
                CONF_ENTITY_ID: entry.id,
                CONF_TYPE: ACTION_TYPE_MARK_COMPLETE,
            }
        )

    return actions


async def async_call_action_from_config(
    hass: HomeAssistant,
    config: ConfigType,
    variables: TemplateVarsType,
    context: Context | None,
) -> None:
    """Handle execution of a Maint device action."""
    _ = variables
    _ = context
    registry = er.async_get(hass)
    entity_entry = registry.async_get(config[CONF_ENTITY_ID])
    if entity_entry is None:
        message = "Entity not found for Maint device action"
        raise InvalidDeviceAutomationConfig(message)

    if entity_entry.domain != "binary_sensor" or entity_entry.platform != DOMAIN:
        message = "Entity is not a Maint task binary sensor"
        raise InvalidDeviceAutomationConfig(message)

    entry_id = entity_entry.config_entry_id
    if entry_id is None or hass.config_entries is None:
        message = "Maint config entry not available"
        raise InvalidDeviceAutomationConfig(message)

    config_entry = hass.config_entries.async_get_entry(entry_id)
    if config_entry is None or config_entry.domain != DOMAIN:
        message = "Maint config entry missing for action"
        raise InvalidDeviceAutomationConfig(message)

    runtime_data = getattr(config_entry, "runtime_data", None)
    if not isinstance(runtime_data, MaintRuntimeData):
        message = "Maint runtime data missing for action"
        raise InvalidDeviceAutomationConfig(message)

    await _async_mark_task_complete(
        store=runtime_data.task_store, entry_id=entry_id, entity_id=entity_entry
    )


async def async_get_action_capabilities(
    hass: HomeAssistant, config: ConfigType
) -> dict[str, vol.Schema]:
    """Return action capabilities."""
    _ = (hass, config)
    return {}


async def _async_mark_task_complete(
    *, store: MaintTaskStore, entry_id: str, entity_id: er.RegistryEntry
) -> None:
    """Mark a Maint task complete."""
    unique_id = entity_id.unique_id
    expected_prefix = f"{entry_id}_"
    if unique_id is None or not unique_id.startswith(expected_prefix):
        message = "Maint task id missing from entity"
        raise InvalidDeviceAutomationConfig(message)

    task_id = unique_id.removeprefix(expected_prefix)
    if not task_id:
        message = "Maint task id missing from entity"
        raise InvalidDeviceAutomationConfig(message)

    try:
        task = await store.async_get_task(entry_id, task_id)
    except KeyError as err:
        message = f"Maint task {task_id} not found for entry {entry_id}"
        raise InvalidDeviceAutomationConfig(message) from err

    today = dt_util.now().date()
    await store.async_update_task(
        entry_id,
        task_id,
        description=task.description,
        last_completed=today,
        frequency=task.frequency,
        frequency_unit=task.frequency_unit,
    )
    _LOGGER.debug(
        "Marked Maint task %s complete via device action for entry %s",
        task_id,
        entry_id,
    )
