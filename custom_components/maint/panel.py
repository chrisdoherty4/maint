"""Frontend panel registration for Maint."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import DOMAIN

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
