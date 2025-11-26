"""The Maint integration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from homeassistant.const import Platform
from homeassistant.helpers import config_validation as cv

from .const import (
    CONF_LOG_LEVEL,
    DEFAULT_LOG_LEVEL,
    DEFAULT_TITLE,
    DOMAIN,
)
from .models import MaintConfigEntry, MaintRuntimeData, MaintTaskStore
from .panel import async_register_panel, async_unregister_panel
from .websocket import async_register_websocket_handlers

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
PLATFORMS: list[Platform] = [Platform.BINARY_SENSOR, Platform.SENSOR]
_LOGGER = logging.getLogger(__name__)
LOG_LEVEL_MAP = {
    "debug": logging.DEBUG,
    "info": logging.INFO,
}

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.typing import ConfigType


async def async_setup(hass: HomeAssistant, _config: ConfigType) -> bool:
    """Set up Maint."""
    data = hass.data.setdefault(DOMAIN, {})
    _apply_log_level(DEFAULT_LOG_LEVEL)
    _LOGGER.info("Setting up Maint integration")
    await _async_get_task_store(hass)
    await async_register_panel(hass)
    if not data.get("ws_registered"):
        async_register_websocket_handlers(hass)
        data["ws_registered"] = True
        _LOGGER.debug("Registered Maint websocket handlers")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: MaintConfigEntry) -> bool:
    """Set up Maint from a config entry."""
    configured_level = entry.options.get(CONF_LOG_LEVEL, DEFAULT_LOG_LEVEL)
    _apply_log_level(configured_level)
    _LOGGER.info(
        "Setting up Maint config entry %s (log_level=%s)",
        entry.entry_id,
        configured_level,
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


def _apply_log_level(log_level: str) -> None:
    """Apply the configured log level for Maint loggers."""
    level = LOG_LEVEL_MAP.get(log_level.lower(), logging.INFO)
    # Ensure the package logger and all Maint child loggers share the same level.
    package_prefix = f"{__package__}."
    for logger_name in list(logging.root.manager.loggerDict):
        if logger_name == __package__ or logger_name.startswith(package_prefix):
            logging.getLogger(logger_name).setLevel(level)
    _LOGGER.debug(
        "Applied Maint log level %s (%s)",
        log_level,
        level,
    )
