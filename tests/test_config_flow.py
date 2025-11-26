# ruff: noqa: S101,SLF001
"""Tests for the Maint config flow."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock

import pytest
from homeassistant.data_entry_flow import FlowResultType

from custom_components.maint.config_flow import ConfigFlow
from custom_components.maint.const import DEFAULT_TITLE, DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


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
