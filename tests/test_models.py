# ruff: noqa: S101
"""Tests for Maint data models and task store."""

from __future__ import annotations

from datetime import date, datetime

import pytest
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from custom_components.maint.models import (
    SIGNAL_TASK_CREATED,
    SIGNAL_TASK_DELETED,
    SIGNAL_TASK_UPDATED,
    MaintTask,
    MaintTaskStore,
    Recurrence,
)


def _interval(days: int = 14) -> Recurrence:
    return Recurrence(type="interval", every=days, unit="days")


def test_next_scheduled_interval_uses_unit() -> None:
    """Ensure next_scheduled is derived from interval recurrence."""
    task = MaintTask(
        task_id="abc",
        description="Change air filter",
        last_completed=date(2024, 1, 1),
        recurrence=_interval(14),
    )

    assert task.next_scheduled == date(2024, 1, 15)


def test_next_scheduled_weekly_advances_to_next_selected_day() -> None:
    """Weekly recurrences should move to the next chosen weekday."""
    task = MaintTask(
        task_id="abc",
        description="Water plants",
        last_completed=date(2024, 1, 5),  # Friday
        recurrence=Recurrence(type="weekly", days_of_week=(0, 3)),  # Mon, Thu
    )

    assert task.next_scheduled == date(2024, 1, 8)


def test_next_scheduled_weekly_respects_week_interval() -> None:
    """Weekly recurrences should honor the configured week spacing."""
    task = MaintTask(
        task_id="abc",
        description="Take out compost",
        last_completed=date(2024, 1, 6),  # Saturday
        recurrence=Recurrence(type="weekly", every=4, days_of_week=(5,)),
    )

    assert task.next_scheduled == date(2024, 2, 3)


def test_weekly_recurrence_defaults_to_single_week_interval() -> None:
    """Weekly recurrence should assume weekly cadence when not specified."""
    recurrence = Recurrence.from_dict({"type": "weekly", "days": [1, 3]})

    assert recurrence.every == 1
    assert recurrence.days_of_week == (1, 3)


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
        recurrence=_interval(frequency),
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
        recurrence=Recurrence(type="weekly", days_of_week=(1, 4)),
    )

    restored = MaintTask.from_dict(original.to_dict())

    assert restored.task_id == original.task_id
    assert restored.description == original.description
    assert restored.last_completed == original.last_completed
    assert restored.recurrence.type == "weekly"
    assert restored.recurrence.every == 1
    assert restored.recurrence.days_of_week == (1, 4)


@pytest.mark.parametrize(
    ("kwargs", "message"),
    [
        ({"description": ""}, "description cannot be empty"),
        ({"entry_id": ""}, "entry_id cannot be empty"),
        ({"recurrence": "weekly"}, "recurrence must be provided"),
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
    recurrence = Recurrence(type="interval", every=30, unit="days")

    try:
        task = await store.async_create_task(
            entry_id,
            description="Inspect roof",
            last_completed=date(2024, 3, 1),
            recurrence=recurrence,
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
            recurrence=Recurrence(
                type="interval", every=updated_frequency, unit="days"
            ),
        )
        assert updated.description.endswith("gutters")
        assert updated.recurrence.every == updated_frequency
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


@pytest.mark.asyncio
async def test_set_last_completed_updates_only_date(hass: HomeAssistant) -> None:
    """Setting last completed should preserve description and recurrence."""
    store = MaintTaskStore(hass)
    entry_id = "entry-1"
    recurrence_days = 10
    task = await store.async_create_task(
        entry_id=entry_id,
        description="Test task",
        last_completed=date(2024, 4, 1),
        recurrence=_interval(recurrence_days),
    )

    updates: list[date] = []

    @callback
    def _record_update(_entry_id: str, updated_task: MaintTask) -> None:
        updates.append(updated_task.last_completed)

    unsubscribe = async_dispatcher_connect(hass, SIGNAL_TASK_UPDATED, _record_update)

    try:
        await store.async_set_last_completed(
            entry_id=entry_id,
            task_id=task.task_id,
            last_completed=date(2024, 5, 5),
        )
    finally:
        unsubscribe()

    updated_task = await store.async_get_task(entry_id, task.task_id)
    assert updated_task.last_completed == date(2024, 5, 5)
    assert updated_task.description == "Test task"
    assert updated_task.recurrence.every == recurrence_days
    assert updates == [date(2024, 5, 5)]


@pytest.mark.asyncio
async def test_remove_entry_purges_tasks(hass: HomeAssistant) -> None:
    """Removing an entry should delete all tasks and persist the removal."""
    store = MaintTaskStore(hass)
    entry_id = "entry-remove"
    await store.async_create_task(
        entry_id=entry_id,
        description="Purge me",
        last_completed=date(2024, 1, 1),
        recurrence=_interval(7),
    )

    await store.async_remove_entry(entry_id)

    tasks = await store.async_list_tasks(entry_id)
    assert tasks == []

    # Persistence check: reloading the store should not resurrect the tasks.
    reloaded = MaintTaskStore(hass)
    assert await reloaded.async_list_tasks(entry_id) == []
