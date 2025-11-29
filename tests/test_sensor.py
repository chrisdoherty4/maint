# ruff: noqa: S101, SLF001
"""Tests for Maint sensor entity behavior."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import TYPE_CHECKING
from unittest.mock import MagicMock

import pytest
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from custom_components.maint.domain import DOMAIN
from custom_components.maint.models import MaintTask, Recurrence
from custom_components.maint.sensor import MaintTasksDueSensor

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


@dataclass
class FakeEntry:
    """Minimal ConfigEntry stand-in for tests."""

    entry_id: str
    title: str = "Maint"


def _make_task(
    task_id: str,
    last_completed: date,
    days: int,
    description: str = "Test task",
) -> MaintTask:
    return MaintTask(
        task_id=task_id,
        description=description,
        last_completed=last_completed,
        recurrence=Recurrence(type="interval", every=days, unit="days"),
    )


def test_native_value_counts_due_tasks(
    monkeypatch: pytest.MonkeyPatch, hass: HomeAssistant
) -> None:
    """native_value should count tasks whose binary sensors are on."""
    monkeypatch.setattr(
        "custom_components.maint.models.dt_util.now",
        lambda: datetime(2024, 2, 10, tzinfo=dt_util.UTC),
    )
    due_task = _make_task("task-1", date(2024, 2, 1), days=3)
    future_task = _make_task("task-2", date(2024, 2, 9), days=7)
    sensor = MaintTasksDueSensor(
        entry=FakeEntry("entry-1"), tasks=[due_task, future_task]
    )
    sensor.hass = hass

    assert sensor.native_value == 1


@pytest.mark.asyncio
async def test_extra_state_attributes_include_binary_sensor(
    monkeypatch: pytest.MonkeyPatch, hass: HomeAssistant
) -> None:
    """Attributes should list due tasks and their binary sensor entity ids."""
    monkeypatch.setattr(
        "custom_components.maint.models.dt_util.now",
        lambda: datetime(2024, 3, 10, tzinfo=dt_util.UTC),
    )
    entry = FakeEntry("entry-1")
    due_task = _make_task(
        "task-1", date(2024, 3, 1), days=5, description="Replace filters"
    )
    not_due_task = _make_task(
        "task-2", date(2024, 3, 9), days=10, description="Inspect vents"
    )
    registry = er.async_get(hass)
    await registry.async_load()
    entity = registry.async_get_or_create(
        "binary_sensor",
        DOMAIN,
        f"{entry.entry_id}_{due_task.task_id}",
        suggested_object_id="maint_replace_filters",
    )

    sensor = MaintTasksDueSensor(entry=entry, tasks=[due_task, not_due_task])
    sensor.hass = hass

    attributes = sensor.extra_state_attributes
    assert attributes["due_tasks"] == [
        {
            "description": "Replace filters",
            "binary_sensor": entity.entity_id,
        }
    ]


def test_handle_task_updates_refresh_state(
    monkeypatch: pytest.MonkeyPatch, hass: HomeAssistant
) -> None:
    """Task lifecycle handlers should refresh stored tasks and state."""
    monkeypatch.setattr(
        "custom_components.maint.models.dt_util.now",
        lambda: datetime(2024, 4, 1, tzinfo=dt_util.UTC),
    )
    entry = FakeEntry("entry-1")
    original_task = _make_task("task-1", date(2024, 3, 1), days=20)
    sensor = MaintTasksDueSensor(entry=entry, tasks=[original_task])
    sensor.hass = hass
    sensor.async_write_ha_state = MagicMock()

    updated_task = _make_task(
        "task-1", date(2024, 3, 10), days=5, description="Updated"
    )
    sensor.handle_task_updated(updated_task)
    assert sensor._tasks["task-1"] is updated_task
    sensor.async_write_ha_state.assert_called_once()

    sensor.async_write_ha_state.reset_mock()
    sensor.handle_task_deleted(updated_task)
    assert "task-1" not in sensor._tasks
    sensor.async_write_ha_state.assert_called_once()
