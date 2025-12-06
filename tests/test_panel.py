# ruff: noqa: S101
"""Tests for Maint frontend panel registration."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.maint.domain import DOMAIN
from custom_components.maint.panel import (
    DEFAULT_SIDEBAR_TITLE,
    MODULE_URL,
    PANEL_DIR,
    PANEL_STATIC_PATH,
    WEB_COMPONENT_NAME,
    _async_sidebar_title,
    async_register_panel,
    async_unregister_panel,
)

if TYPE_CHECKING:
    from pathlib import Path

    from homeassistant.core import HomeAssistant


@pytest.mark.asyncio
async def test_register_panel_registers_once(
    monkeypatch: pytest.MonkeyPatch, hass: HomeAssistant
) -> None:
    """Panel registration should run a single time and use localized sidebar titles."""
    hass.config.language = "es-MX"
    hass.http = MagicMock()
    hass.http.async_register_static_paths = AsyncMock()

    monkeypatch.setattr(
        "custom_components.maint.panel.panel_custom.async_register_panel",
        panel_register := AsyncMock(),
    )

    await async_register_panel(hass)
    await async_register_panel(hass)

    hass.http.async_register_static_paths.assert_awaited_once()
    static_args, _ = hass.http.async_register_static_paths.call_args
    assert len(static_args[0]) == 1
    static_path = static_args[0][0]
    assert static_path.url_path == PANEL_STATIC_PATH
    assert static_path.path == str(PANEL_DIR)
    assert static_path.cache_headers is False

    panel_register.assert_awaited_once_with(
        hass=hass,
        frontend_url_path=DOMAIN,
        webcomponent_name=WEB_COMPONENT_NAME,
        sidebar_title="Mantenimiento",
        sidebar_icon="mdi:clipboard-text",
        module_url=MODULE_URL,
        require_admin=True,
    )
    assert hass.data[DOMAIN]["panel_registered"] is True


@pytest.mark.asyncio
async def test_unregister_panel(
    monkeypatch: pytest.MonkeyPatch, hass: HomeAssistant
) -> None:
    """Panel unregister should remove the panel when registered."""
    hass.data.setdefault(DOMAIN, {})["panel_registered"] = True
    monkeypatch.setattr(
        "custom_components.maint.panel.frontend.async_remove_panel",
        remove_panel := MagicMock(),
    )

    await async_unregister_panel(hass)

    remove_panel.assert_called_once_with(hass, DOMAIN)
    assert hass.data[DOMAIN]["panel_registered"] is False


@pytest.mark.asyncio
async def test_async_sidebar_title_falls_back_to_default(
    monkeypatch: pytest.MonkeyPatch, hass: HomeAssistant, tmp_path: Path
) -> None:
    """Sidebar title should fall back to the default when translations are missing."""
    hass.config.language = "zz"
    monkeypatch.setattr("custom_components.maint.panel.TRANSLATIONS_DIR", tmp_path)

    assert await _async_sidebar_title(hass) == DEFAULT_SIDEBAR_TITLE
