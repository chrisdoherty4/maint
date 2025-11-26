"""Config flow for the Maint integration."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

from .const import (
    CONF_LOG_LEVEL,
    CONF_SENSOR_PREFIX,
    DEFAULT_LOG_LEVEL,
    DEFAULT_SENSOR_PREFIX,
    DEFAULT_TITLE,
    DOMAIN,
    LOG_LEVEL_OPTIONS,
)

if TYPE_CHECKING:
    from collections.abc import Mapping

    from homeassistant.config_entries import ConfigEntry


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Maint."""

    VERSION = 1
    MINOR_VERSION = 0

    async def async_step_user(
        self, _user_input: Mapping[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Handle the initial step."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        return self.async_create_entry(
            title=DEFAULT_TITLE,
            data={},
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Get the options flow for this handler."""
        return OptionsFlowHandler(config_entry)


class OptionsFlowHandler(config_entries.OptionsFlow):
    """Handle Maint options."""

    def __init__(self, config_entry: ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: Mapping[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Manage the Maint options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        current_prefix = (
            self.config_entry.options.get(CONF_SENSOR_PREFIX) or DEFAULT_SENSOR_PREFIX
        )
        current_log_level = self.config_entry.options.get(
            CONF_LOG_LEVEL, DEFAULT_LOG_LEVEL
        )
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_SENSOR_PREFIX, default=current_prefix): vol.All(
                        str, vol.Length(min=1)
                    ),
                    vol.Optional(CONF_LOG_LEVEL, default=current_log_level): vol.In(
                        LOG_LEVEL_OPTIONS
                    ),
                }
            ),
        )
