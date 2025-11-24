"""Config flow for the Maint integration."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.const import CONF_NAME
from homeassistant.helpers import config_validation as cv, selector

from .const import DOMAIN

DEFAULT_NAME = "Home maintenance"


def _validated_name(value: Any) -> str:
    """Validate and normalize a task list name."""
    name = cv.string(value).strip()
    if not name:
        raise vol.Invalid("name_required")
    return name


def _build_schema(current: Mapping[str, Any] | None = None) -> vol.Schema:
    """Return the base schema."""
    return vol.Schema(
        {
            vol.Required(
                CONF_NAME,
                default=current.get(CONF_NAME, DEFAULT_NAME)
                if current
                else DEFAULT_NAME,
            ): selector.TextSelector(selector.TextSelectorConfig()),
        }
    )


class ConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Maint."""

    VERSION = 1
    MINOR_VERSION = 1

    @staticmethod
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Return the options flow."""
        return OptionsFlowHandler()

    async def async_step_user(
        self, user_input: Mapping[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Handle the initial step."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                name = _validated_name(user_input[CONF_NAME])
            except vol.Invalid:
                errors[CONF_NAME] = "name_required"
            else:
                await self.async_set_unique_id(DOMAIN)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=name,
                    data={CONF_NAME: name},
                )

        return self.async_show_form(
            step_id="user",
            data_schema=_build_schema(user_input),
            errors=errors,
        )


class OptionsFlowHandler(config_entries.OptionsFlow):
    """Handle Maint options."""

    async def async_step_init(
        self, user_input: Mapping[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Handle the options flow."""
        errors: dict[str, str] = {}
        current: dict[str, Any] = {
            **self.config_entry.data,
            **self.config_entry.options,
        }
        if user_input is not None:
            try:
                name = _validated_name(user_input[CONF_NAME])
            except vol.Invalid:
                errors[CONF_NAME] = "name_required"
            else:
                self.hass.config_entries.async_update_entry(
                    self.config_entry, title=name, data={CONF_NAME: name}
                )
                return self.async_create_entry(data={CONF_NAME: name})

        return self.async_show_form(
            step_id="init",
            data_schema=_build_schema(current),
            errors=errors,
        )
