"""Config flow for the Maint integration."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

from .calendar_sync import (
    CONF_CALENDAR_NAME,
    CONF_SYNC_TO_CALENDAR,
    DEFAULT_CALENDAR_NAME,
)
from .domain import DOMAIN

if TYPE_CHECKING:
    from collections.abc import Mapping

    from homeassistant.config_entries import ConfigEntry

DEFAULT_TITLE = "Maint"


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
        """Return the options flow handler."""
        return MaintOptionsFlow(config_entry)


class MaintOptionsFlow(config_entries.OptionsFlow):
    """Handle Maint options."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self._maint_config_entry = config_entry

    @property
    def config_entry(self) -> config_entries.ConfigEntry:
        """Return the config entry linked to this options flow."""
        return self._maint_config_entry

    async def async_step_init(
        self, user_input: Mapping[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Manage the Maint options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=dict(user_input))

        options = self.config_entry.options
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_SYNC_TO_CALENDAR,
                        default=options.get(CONF_SYNC_TO_CALENDAR, False),
                    ): bool,
                    vol.Required(
                        CONF_CALENDAR_NAME,
                        default=options.get(CONF_CALENDAR_NAME, DEFAULT_CALENDAR_NAME),
                    ): str,
                }
            ),
        )
