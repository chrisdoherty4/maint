# ruff: noqa: S101
"""Tests for Maint integration setup."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock

import pytest

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

from custom_components.maint import (
    DATA_KEY_WS_REGISTERED,
    async_setup,
)
from custom_components.maint.domain import DOMAIN


@pytest.mark.asyncio
async def test_async_setup_registers_components(
    monkeypatch: pytest.MonkeyPatch, hass: HomeAssistant
) -> None:
    """async_setup should prepare services, panel, and websocket handlers."""
    register_panel = AsyncMock()
    register_services = MagicMock()
    register_ws = MagicMock()

    monkeypatch.setattr("custom_components.maint.async_register_panel", register_panel)
    monkeypatch.setattr(
        "custom_components.maint.async_register_services", register_services
    )
    monkeypatch.setattr(
        "custom_components.maint.async_register_websocket_handlers", register_ws
    )

    assert await async_setup(hass, {}) is True
    assert hass.data[DOMAIN][DATA_KEY_WS_REGISTERED] is True

    register_panel.assert_awaited_once()
    register_services.assert_called_once()
    register_ws.assert_called_once()

    # Subsequent calls should not re-register websocket handlers
    await async_setup(hass, {})
    assert register_ws.call_count == 1
