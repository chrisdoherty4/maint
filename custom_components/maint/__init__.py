"""The Maint integration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from homeassistant.const import Platform
from homeassistant.helpers import config_validation as cv

from .const import DEFAULT_TITLE, DOMAIN
from .models import MaintConfigEntry, MaintRuntimeData, MaintTaskStore
from .panel import async_register_panel
from .websocket import async_register_websocket_handlers

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
PLATFORMS: list[Platform] = [Platform.BINARY_SENSOR]
_LOGGER = logging.getLogger(__name__)

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.typing import ConfigType


async def async_setup(hass: HomeAssistant, _config: ConfigType) -> bool:
    """Set up Maint."""
    data = hass.data.setdefault(DOMAIN, {})
    _LOGGER.debug("Setting up Maint integration")
    await _async_get_task_store(hass)
    await async_register_panel(hass)
    if not data.get("ws_registered"):
        async_register_websocket_handlers(hass)
        data["ws_registered"] = True
        _LOGGER.debug("Registered Maint websocket handlers")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: MaintConfigEntry) -> bool:
    """Set up Maint from a config entry."""
    _LOGGER.debug("Setting up Maint config entry %s", entry.entry_id)
    if entry.unique_id is None:
        hass.config_entries.async_update_entry(entry, unique_id=DOMAIN)

    if entry.title != DEFAULT_TITLE:
        hass.config_entries.async_update_entry(entry, title=DEFAULT_TITLE)

    task_store = await _async_get_task_store(hass)
    entry.runtime_data = MaintRuntimeData(task_store=task_store)

    entry.async_on_unload(entry.add_update_listener(config_entry_update_listener))

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def config_entry_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Update listener, called when the config entry options are changed."""
    _LOGGER.debug(
        "Reloading Maint config entry %s after options update", entry.entry_id
    )
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.debug("Unloading Maint config entry %s", entry.entry_id)
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def _async_get_task_store(hass: HomeAssistant) -> MaintTaskStore:
    """Return the shared Maint task store."""
    data = hass.data.setdefault(DOMAIN, {})
    if (store := data.get("task_store")) is None:
        _LOGGER.debug("Creating Maint task store")
        store = MaintTaskStore(hass)
        await store.async_load()
        data["task_store"] = store
    else:
        _LOGGER.debug("Reusing existing Maint task store")
    return store
