# ruff: noqa: S101,SLF001
"""Tests for the Maint config flow."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from unittest.mock import AsyncMock, MagicMock

import homeassistant.config_entries as ce
import pytest
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import frame

from custom_components.maint.calendar_sync import (
    CONF_CALENDAR_NAME,
    CONF_SYNC_TO_CALENDAR,
    DEFAULT_CALENDAR_NAME,
)
from custom_components.maint.config_flow import (
    DEFAULT_TITLE,
    ConfigFlow,
    MaintOptionsFlow,
)
from custom_components.maint.domain import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


def _suppress_usage(*_: Any, **__: Any) -> None:
    """Ignore usage reports during tests."""


@pytest.mark.asyncio
async def test_user_flow_creates_entry_with_default_title(hass: HomeAssistant) -> None:
    """Config flow should immediately create an entry with the default title."""
    flow = ConfigFlow()
    flow.hass = hass
    flow._async_current_entries = MagicMock(return_value=[])
    flow.async_set_unique_id = AsyncMock()
    flow._abort_if_unique_id_configured = MagicMock()

    result = await flow.async_step_user()

    flow.async_set_unique_id.assert_awaited_once_with(DOMAIN)
    flow._abort_if_unique_id_configured.assert_called_once()
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == DEFAULT_TITLE
    assert result["data"] == {}


@pytest.mark.asyncio
async def test_user_flow_aborts_when_entry_exists(hass: HomeAssistant) -> None:
    """Config flow should abort when a Maint entry is already configured."""
    flow = ConfigFlow()
    flow.hass = hass
    flow._async_current_entries = MagicMock(return_value=[MagicMock()])

    result = await flow.async_step_user()

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


@pytest.mark.asyncio
async def test_options_flow_defaults(hass: HomeAssistant) -> None:
    """Options flow should expose calendar sync defaults."""
    entry = MagicMock(options={})
    frame._hass.hass = hass
    frame.report_usage = _suppress_usage  # type: ignore[assignment]
    ce.report_usage = _suppress_usage  # type: ignore[assignment]
    flow = MaintOptionsFlow(entry)
    flow.hass = hass

    result = await flow.async_step_init()

    assert result["type"] is FlowResultType.FORM
    schema = result["data_schema"]
    assert schema({}) == {
        CONF_SYNC_TO_CALENDAR: False,
        CONF_CALENDAR_NAME: DEFAULT_CALENDAR_NAME,
    }


@pytest.mark.asyncio
async def test_options_flow_saves_user_input(hass: HomeAssistant) -> None:
    """Options flow should persist user selections."""
    entry = MagicMock(options={})
    frame._hass.hass = hass
    frame.report_usage = _suppress_usage  # type: ignore[assignment]
    ce.report_usage = _suppress_usage  # type: ignore[assignment]
    flow = MaintOptionsFlow(entry)
    flow.hass = hass

    user_input = {
        CONF_SYNC_TO_CALENDAR: True,
        CONF_CALENDAR_NAME: "House tasks",
    }
    result = await flow.async_step_init(user_input)

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"] == user_input


def test_async_get_options_flow_returns_handler() -> None:
    """Options flow factory should return a MaintOptionsFlow instance."""
    options_flow = ConfigFlow.async_get_options_flow(MagicMock())

    assert isinstance(options_flow, MaintOptionsFlow)
