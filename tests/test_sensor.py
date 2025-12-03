# ruff: noqa: S101, SLF001
"""Tests for Maint sensor entity behavior."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import TYPE_CHECKING
from unittest.mock import MagicMock

import pytest
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.util import dt as dt_util

from custom_components.maint.domain import DOMAIN
from custom_components.maint.models import (
    SIGNAL_TASK_CREATED,
    SIGNAL_TASK_DELETED,
    SIGNAL_TASK_UPDATED,
    MaintRuntimeData,
    MaintTask,
    MaintTaskStore,
    Recurrence,
)
from custom_components.maint.sensor import MaintTasksDueSensor, async_setup_entry

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


def test_binary_sensor_entity_id_returns_none_without_hass() -> None:
    """Binary sensor lookup should return None when hass is not set."""
    task = _make_task("task-1", date(2024, 5, 1), days=7)
    sensor = MaintTasksDueSensor(entry=FakeEntry("entry-1"), tasks=[task])

    assert sensor._binary_sensor_entity_id(task) is None


@pytest.mark.asyncio
async def test_async_setup_entry_registers_and_reacts_to_signals(
    monkeypatch: pytest.MonkeyPatch, hass: HomeAssistant
) -> None:
    """async_setup_entry should wire dispatcher listeners for task lifecycle events."""
    monkeypatch.setattr(
        "custom_components.maint.models.dt_util.now",
        lambda: datetime(2024, 5, 1, tzinfo=dt_util.UTC),
    )
    store = MaintTaskStore(hass)
    entry_id = "entry-sensor"
    initial_task = await store.async_create_task(
        entry_id=entry_id,
        description="Existing task",
        last_completed=date(2024, 4, 1),
        recurrence=Recurrence(type="interval", every=10, unit="days"),
    )
    entry = MagicMock()
    entry.entry_id = entry_id
    entry.title = "Maint"
    entry.runtime_data = MaintRuntimeData(task_store=store)
    unloads: list[object] = []
    entry.async_on_unload = lambda cb: unloads.append(cb)

    added_entities: list[MaintTasksDueSensor] = []

    def _add_entities(entities: list[MaintTasksDueSensor], **_kwargs: object) -> None:
        for entity in entities:
            entity.hass = hass
            entity.async_write_ha_state = MagicMock()
        added_entities.extend(entities)

    await async_setup_entry(hass, entry, _add_entities)
    assert added_entities
    sensor = added_entities[0]
    assert initial_task.task_id in sensor._tasks

    new_task = _make_task("task-new", date(2024, 4, 15), days=5)
    async_dispatcher_send(hass, SIGNAL_TASK_CREATED, entry_id, new_task)
    await hass.async_block_till_done()
    assert "task-new" in sensor._tasks
    assert sensor.async_write_ha_state.called

    sensor.async_write_ha_state.reset_mock()
    updated_task = _make_task("task-new", date(2024, 4, 20), days=3)
    async_dispatcher_send(hass, SIGNAL_TASK_UPDATED, entry_id, updated_task)
    await hass.async_block_till_done()
    assert sensor._tasks["task-new"] is updated_task
    assert sensor.async_write_ha_state.called

    sensor.async_write_ha_state.reset_mock()
    async_dispatcher_send(hass, SIGNAL_TASK_DELETED, entry_id, updated_task)
    await hass.async_block_till_done()
    assert "task-new" not in sensor._tasks
    assert sensor.async_write_ha_state.called
