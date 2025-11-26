# ruff: noqa: S101,SLF001,FBT001
"""Tests for Maint binary sensor entity behavior."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any
from unittest.mock import MagicMock

import pytest
from homeassistant.util import dt as dt_util

from custom_components.maint.binary_sensor import MaintTaskBinarySensor
from custom_components.maint.const import CONF_SENSOR_PREFIX, DEFAULT_SENSOR_PREFIX
from custom_components.maint.models import MaintTask


@dataclass
class FakeEntry:
    """Minimal ConfigEntry stand-in for tests."""

    entry_id: str
    options: dict[str, Any] = field(default_factory=dict)
    title: str = "Maintenance"


def _make_task(frequency: int = 10) -> MaintTask:
    return MaintTask(
        task_id="task-1",
        description="Change air filter",
        last_completed=date(2024, 1, 1),
        frequency=frequency,
    )


@pytest.mark.parametrize(
    ("today", "expected"),
    [
        (datetime(2024, 1, 5, tzinfo=dt_util.UTC), False),
        (datetime(2024, 1, 12, tzinfo=dt_util.UTC), True),
    ],
)
def test_is_on_reflects_due_date(
    monkeypatch: pytest.MonkeyPatch, today: datetime, expected: bool
) -> None:
    """is_on is true when the current date is on or after next scheduled."""
    monkeypatch.setattr("custom_components.maint.models.dt_util.now", lambda: today)
    sensor = MaintTaskBinarySensor(entry=FakeEntry("entry-1"), task=_make_task())

    assert sensor.is_on is expected


def test_suggested_object_id_uses_prefix() -> None:
    """Suggested object id should slugify prefix and description."""
    entry = FakeEntry(
        entry_id="entry-1",
        options={CONF_SENSOR_PREFIX: "Maint Prefix"},
    )
    sensor = MaintTaskBinarySensor(entry=entry, task=_make_task())

    assert sensor.suggested_object_id == "maint_prefix_change_air_filter"


def test_handle_task_update_refreshes_name_and_state() -> None:
    """handle_task_update should swap tasks and trigger a state write."""
    entry = FakeEntry("entry-1", options={CONF_SENSOR_PREFIX: DEFAULT_SENSOR_PREFIX})
    sensor = MaintTaskBinarySensor(entry=entry, task=_make_task())
    sensor.async_write_ha_state = MagicMock()

    new_task = MaintTask(
        task_id="task-1",
        description="Check smoke alarms",
        last_completed=date(2024, 2, 1),
        frequency=30,
    )
    sensor.handle_task_update(new_task)

    assert sensor._task is new_task
    assert sensor._attr_name == "Check smoke alarms"
    sensor.async_write_ha_state.assert_called_once()
