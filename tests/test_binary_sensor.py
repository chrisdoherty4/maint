# ruff: noqa: S101,SLF001,FBT001
"""Tests for Maint binary sensor entity behavior."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock

import pytest
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from custom_components.maint.binary_sensor import MaintTaskBinarySensor
from custom_components.maint.domain import DOMAIN
from custom_components.maint.models import MaintTask, Recurrence

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


@dataclass
class FakeEntry:
    """Minimal ConfigEntry stand-in for tests."""

    entry_id: str
    title: str = "Maint"


def _make_task(frequency: int = 10) -> MaintTask:
    return MaintTask(
        task_id="task-1",
        description="Change air filter",
        last_completed=date(2024, 1, 1),
        recurrence=Recurrence(type="interval", every=frequency, unit="days"),
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
    """Suggested object id should slugify title and description."""
    entry = FakeEntry(entry_id="entry-1", title="Maint")
    sensor = MaintTaskBinarySensor(entry=entry, task=_make_task())

    assert sensor.suggested_object_id == "maint_change_air_filter"


def test_handle_task_update_refreshes_name_and_state() -> None:
    """handle_task_update should swap tasks and trigger a state write."""
    entry = FakeEntry("entry-1")
    sensor = MaintTaskBinarySensor(entry=entry, task=_make_task())
    sensor.async_write_ha_state = MagicMock()

    new_task = MaintTask(
        task_id="task-1",
        description="Check smoke alarms",
        last_completed=date(2024, 2, 1),
        recurrence=Recurrence(type="interval", every=30, unit="days"),
    )
    sensor.handle_task_update(new_task)

    assert sensor._task is new_task
    assert sensor._attr_name == "Check smoke alarms"
    sensor.async_write_ha_state.assert_called_once()


@pytest.mark.asyncio
async def test_handle_task_deleted_removes_registry_entry(
    hass: HomeAssistant,
) -> None:
    """Deleting a task should drop the entity from the registry."""
    entry = FakeEntry("entry-1")
    task = _make_task()
    sensor = MaintTaskBinarySensor(entry=entry, task=task)
    sensor.hass = hass
    registry = er.async_get(hass)
    await registry.async_load()
    entity_entry = registry.async_get_or_create(
        "binary_sensor", DOMAIN, sensor.unique_id, suggested_object_id="maint_test_task"
    )
    sensor.entity_id = entity_entry.entity_id
    sensor.async_remove = AsyncMock()

    await sensor.async_remove_from_hass(hass)
    await hass.async_block_till_done()

    assert registry.async_get(entity_entry.entity_id) is None
    sensor.async_remove.assert_awaited_once()
