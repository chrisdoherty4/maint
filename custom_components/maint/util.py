"""Shared utilities for Maint entities."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.util import slugify

from .const import CONF_SENSOR_PREFIX, DEFAULT_SENSOR_PREFIX

if TYPE_CHECKING:
    from .models import MaintConfigEntry


def configured_sensor_prefix(entry: MaintConfigEntry) -> str:
    """Return the slugified sensor prefix from options."""
    raw_prefix = entry.options.get(CONF_SENSOR_PREFIX, DEFAULT_SENSOR_PREFIX)
    return slugify(raw_prefix)
