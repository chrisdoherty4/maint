# ruff: noqa: S101
"""Tests for Maint data models and task store."""

from __future__ import annotations

from datetime import date, datetime

import pytest
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from custom_components.maint.models import (
    FREQUENCY_UNIT_MONTHS,
    FREQUENCY_UNIT_WEEKS,
    SIGNAL_TASK_CREATED,
    SIGNAL_TASK_DELETED,
    SIGNAL_TASK_UPDATED,
    MaintTask,
    MaintTaskStore,
)


def test_next_scheduled_uses_frequency_in_days() -> None:
    """Ensure next_scheduled is derived from last completion date."""
    task = MaintTask(
        task_id="abc",
        description="Change air filter",
        last_completed=date(2024, 1, 1),
        frequency=14,
    )

    assert task.next_scheduled == date(2024, 1, 15)


@pytest.mark.parametrize(
    ("today", "last_completed", "frequency", "expected"),
    [
        (date(2024, 1, 10), date(2024, 1, 1), 14, False),
        (date(2024, 1, 15), date(2024, 1, 1), 14, True),
        (date(2024, 1, 16), date(2024, 1, 1), 14, True),
    ],
)
def test_is_due_reflects_next_scheduled(
    monkeypatch: pytest.MonkeyPatch,
    today: date,
    last_completed: date,
    frequency: int,
    *,
    expected: bool,
) -> None:
    """is_due should compare today's date to the next scheduled date."""
    task = MaintTask(
        task_id="abc",
        description="Change air filter",
        last_completed=last_completed,
        frequency=frequency,
    )
    monkeypatch.setattr(
        "custom_components.maint.models.dt_util.now",
        lambda: datetime.combine(today, datetime.min.time()),
    )

    assert task.is_due is expected


def test_task_serialization_round_trip_preserves_fields() -> None:
    """Verify tasks serialize and deserialize without losing data."""
    original = MaintTask(
        task_id="task-1",
        description="Test serialize",
        last_completed=date(2024, 2, 10),
        frequency=4,
        frequency_unit=FREQUENCY_UNIT_WEEKS,
    )

    restored = MaintTask.from_dict(original.to_dict())

    assert restored.task_id == original.task_id
    assert restored.description == original.description
    assert restored.last_completed == original.last_completed
    assert restored.frequency == original.frequency
    assert restored.frequency_unit == original.frequency_unit


@pytest.mark.parametrize(
    ("kwargs", "message"),
    [
        ({"frequency": 0}, "frequency must be greater than 0"),
        ({"description": ""}, "description cannot be empty"),
        ({"entry_id": ""}, "entry_id cannot be empty"),
        ({"frequency_unit": "years"}, "frequency_unit must be one of"),
    ],
)
def test_validate_raises_on_invalid_inputs(
    kwargs: dict[str, object], message: str
) -> None:
    """Validate enforcement rejects bad inputs."""
    with pytest.raises(ValueError, match=message):
        MaintTaskStore.validate(**kwargs)


@pytest.mark.asyncio
async def test_task_store_create_update_delete_persists_and_emits_signals(
    hass: HomeAssistant,
) -> None:
    """The task store should persist tasks and emit dispatcher signals."""
    store = MaintTaskStore(hass)
    entry_id = "entry-1"
    events: list[tuple[str, str]] = []

    @callback
    def _record_event(_entry: str, task: MaintTask) -> None:
        events.append((task.task_id, task.description))

    unsub_create = async_dispatcher_connect(hass, SIGNAL_TASK_CREATED, _record_event)
    unsub_update = async_dispatcher_connect(hass, SIGNAL_TASK_UPDATED, _record_event)
    unsub_delete = async_dispatcher_connect(hass, SIGNAL_TASK_DELETED, _record_event)

    updated_frequency = 45

    try:
        task = await store.async_create_task(
            entry_id,
            description="Inspect roof",
            last_completed=date(2024, 3, 1),
            frequency=30,
            frequency_unit=FREQUENCY_UNIT_MONTHS,
        )

        tasks = await store.async_list_tasks(entry_id)
        assert len(tasks) == 1
        assert tasks[0].task_id == task.task_id

        # Persistence across store instances
        reload_store = MaintTaskStore(hass)
        reloaded_tasks = await reload_store.async_list_tasks(entry_id)
        assert reloaded_tasks[0].description == "Inspect roof"

        updated = await store.async_update_task(
            entry_id,
            task.task_id,
            description="Inspect roof and gutters",
            last_completed=date(2024, 3, 15),
            frequency=updated_frequency,
            frequency_unit=FREQUENCY_UNIT_MONTHS,
        )
        assert updated.description.endswith("gutters")
        assert updated.frequency == updated_frequency
        assert updated.last_completed == date(2024, 3, 15)

        deleted = await store.async_delete_task(entry_id, task.task_id)
        assert deleted.task_id == task.task_id
        assert await store.async_list_tasks(entry_id) == []
    finally:
        unsub_create()
        unsub_update()
        unsub_delete()

    event_task_ids = [task_id for task_id, _ in events]
    assert task.task_id in event_task_ids
    assert updated.task_id in event_task_ids
    assert deleted.task_id in event_task_ids
