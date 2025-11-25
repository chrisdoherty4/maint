"""Frontend panel registration for Maint."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

PANEL_STATIC_PATH = "/api/maint_panel_static"
WEB_COMPONENT_NAME = "maint-panel"
MODULE_URL = f"{PANEL_STATIC_PATH}/maint-panel.js"
PANEL_DIR = Path(__file__).parent / "frontend"


async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the custom frontend panel."""
    data = hass.data.setdefault(DOMAIN, {})
    if data.get("panel_registered"):
        return

    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                PANEL_STATIC_PATH,
                str(PANEL_DIR),
                cache_headers=False,
            )
        ]
    )

    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=DOMAIN,
        webcomponent_name=WEB_COMPONENT_NAME,
        sidebar_title="Maintenance",
        sidebar_icon="mdi:clipboard-text",
        module_url=MODULE_URL,
        require_admin=True,
    )

    data["panel_registered"] = True
    _LOGGER.debug("Registered Maint panel")


async def async_unregister_panel(hass: HomeAssistant) -> None:
    """Unregister the custom frontend panel."""
    data = hass.data.get(DOMAIN)
    if not data or not data.get("panel_registered"):
        return

    frontend.async_remove_panel(hass, DOMAIN)
    data["panel_registered"] = False
    _LOGGER.debug("Unregistered Maint panel")
