"""The Maint integration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import Platform
from homeassistant.helpers import config_validation as cv

from .config_flow import DEFAULT_TITLE
from .domain import DOMAIN
from .models import MaintConfigEntry, MaintRuntimeData, MaintTaskStore
from .panel import async_register_panel, async_unregister_panel
from .services import async_register_services
from .websocket import async_register_websocket_handlers

# We only support setup from the UI so we need to load a config entry only schema.
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

# Define the platforms we use.
PLATFORMS: list[Platform] = [Platform.BINARY_SENSOR, Platform.SENSOR]

# Define a key for storing and retrieving the task store in hass.data
DATA_KEY_TASK_STORE = "task_store"

# Define a key for indicating whether or not websockets have been registered.
DATA_KEY_WS_REGISTERED = "ws_registered"

_LOGGER = logging.getLogger(__name__)


if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.typing import ConfigType


async def async_setup(hass: HomeAssistant, _config: ConfigType) -> bool:
    """Set up Maint."""
    data: dict[str, Any] = hass.data.setdefault(DOMAIN, {})
    _LOGGER.info("Setting up Maint integration")
    await _async_get_task_store(hass)
    async_register_services(hass, _async_get_task_store)
    await async_register_panel(hass)
    if not data.get(DATA_KEY_WS_REGISTERED):
        async_register_websocket_handlers(hass)
        data[DATA_KEY_WS_REGISTERED] = True
        _LOGGER.debug("Registered Maint websocket handlers")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: MaintConfigEntry) -> bool:
    """Set up Maint from a config entry."""
    _LOGGER.info(
        "Setting up Maint config entry %s",
        entry.entry_id,
    )
    if entry.unique_id is None:
        hass.config_entries.async_update_entry(entry, unique_id=DOMAIN)

    if entry.title != DEFAULT_TITLE:
        hass.config_entries.async_update_entry(entry, title=DEFAULT_TITLE)

    await async_register_panel(hass)
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
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        loaded_entries = hass.config_entries.async_entries(DOMAIN)
        if len(loaded_entries) == 1 and loaded_entries[0].entry_id == entry.entry_id:
            await async_unregister_panel(hass)
    return unload_ok


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Remove a config entry and purge its tasks."""
    _LOGGER.debug("Removing Maint config entry %s; purging tasks", entry.entry_id)
    store = await _async_get_task_store(hass)
    await store.async_remove_entry(entry.entry_id)


async def _async_get_task_store(hass: HomeAssistant) -> MaintTaskStore:
    """Return the shared Maint task store."""
    data: dict[str, Any] = hass.data.setdefault(DOMAIN, {})
    if (store := data.get(DATA_KEY_TASK_STORE)) is None:
        _LOGGER.debug("Creating Maint task store")
        store = MaintTaskStore(hass)
        await store.async_load()
        data[DATA_KEY_TASK_STORE] = store
    else:
        _LOGGER.debug("Reusing existing Maint task store")
    return store
