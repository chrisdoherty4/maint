"""Frontend panel registration for Maint."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import TYPE_CHECKING

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig

from .domain import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

PANEL_STATIC_PATH = "/api/maint_panel_static"
WEB_COMPONENT_NAME = "maint-panel"
PANEL_DIR = Path(__file__).parent / "frontend"
DIST_DIR = PANEL_DIR / "dist"
MODULE_URL = f"{PANEL_STATIC_PATH}/dist/main.js"
MODULE_FILE = DIST_DIR / "main.js"
SIDEBAR_TITLE_KEY = "component.maint.panel.title"
DEFAULT_SIDEBAR_TITLE = "Maintenance"
TRANSLATIONS_DIR = Path(__file__).parent / "frontend" / "translations"


async def async_register_panel(hass: HomeAssistant) -> None:
    """Register the custom frontend panel."""
    data = hass.data.setdefault(DOMAIN, {})
    if data.get("panel_registered"):
        return

    if not MODULE_FILE.exists():
        _LOGGER.warning(
            "Maint panel build missing at %s; run scripts/frontend to compile assets",
            MODULE_FILE,
        )

    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                PANEL_STATIC_PATH,
                str(PANEL_DIR),
                cache_headers=False,
            )
        ]
    )

    sidebar_title = await _async_sidebar_title(hass)

    await panel_custom.async_register_panel(
        hass=hass,
        frontend_url_path=DOMAIN,
        webcomponent_name=WEB_COMPONENT_NAME,
        sidebar_title=sidebar_title,
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


async def _async_sidebar_title(hass: HomeAssistant) -> str:
    """Return a localized sidebar title for the panel."""
    language = getattr(hass.config, "language", None) or "en"
    candidates = [language]
    if "-" in language:
        base = language.split("-")[0]
        if base not in candidates:
            candidates.append(base)
    if "en" not in candidates:
        candidates.append("en")

    for code in candidates:
        title = await hass.async_add_executor_job(_load_sidebar_title, code)
        if title:
            return title

    return DEFAULT_SIDEBAR_TITLE


def _load_sidebar_title(language: str) -> str | None:
    """Read the sidebar title from the translations file for a language."""
    path = TRANSLATIONS_DIR / f"{language}.json"
    if not path.exists():
        return None
    try:
        with path.open(encoding="utf-8") as fp:
            data = json.load(fp)
        panel = data.get("panel", {})
        title = panel.get("title")
        if isinstance(title, str) and title:
            return title
    except (
        OSError,
        json.JSONDecodeError,
    ):  # pragma: no cover - safest fallback to default
        return None
    return None
