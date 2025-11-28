"""Config flow for the Maint integration."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant import config_entries

from .domain import DOMAIN

if TYPE_CHECKING:
    from collections.abc import Mapping

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
