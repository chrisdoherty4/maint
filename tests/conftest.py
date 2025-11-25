"""Test fixtures for Maint."""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest_asyncio
from homeassistant.core import HomeAssistant

if TYPE_CHECKING:
    from pathlib import Path


@pytest_asyncio.fixture
async def hass(tmp_path: Path) -> HomeAssistant:
    """Provide a Home Assistant instance scoped to the test."""
    hass = HomeAssistant(str(tmp_path))
    yield hass
    await hass.async_stop()
