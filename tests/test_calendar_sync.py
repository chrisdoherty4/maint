# ruff: noqa: S101,SLF001
"""Tests for Maint calendar synchronization."""

from __future__ import annotations

from datetime import date, timedelta
from typing import TYPE_CHECKING, Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from homeassistant.components.calendar.const import (
    DATA_COMPONENT,
    EVENT_END,
    EVENT_START,
    EVENT_UID,
    CalendarEntityFeature,
)
from homeassistant.helpers import frame

from custom_components.maint.calendar_store import CalendarLinkStore
from custom_components.maint.calendar_sync import (
    CONF_CALENDAR_NAME,
    CONF_SYNC_TO_CALENDAR,
    CalendarSyncManager,
)
from custom_components.maint.models import MaintTask, Recurrence

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


class StubCalendarEntity:
    """Minimal calendar entity stub capturing create/update/delete calls."""

    def __init__(self) -> None:
        """Initialize the stub."""
        self.created: list[dict[str, Any]] = []
        self.updated: list[tuple[str, dict[str, Any]]] = []
        self.deleted: list[str] = []
        self.supported_features = (
            CalendarEntityFeature.CREATE_EVENT
            | CalendarEntityFeature.UPDATE_EVENT
            | CalendarEntityFeature.DELETE_EVENT
        )

    async def async_create_event(self, **kwargs: Any) -> None:
        """Simulate event creation."""
        self.created.append(kwargs)

    async def async_update_event(
        self,
        uid: str,
        event: dict[str, Any],
        _recurrence_id: str | None = None,
        _recurrence_range: str | None = None,
    ) -> None:
        """Simulate event update."""
        self.updated.append((uid, event))

    async def async_delete_event(
        self,
        uid: str,
        _recurrence_id: str | None = None,
        _recurrence_range: str | None = None,
    ) -> None:
        """Simulate event deletion."""
        self.deleted.append(uid)


class StubCalendarComponent:
    """Minimal EntityComponent stub exposing get_entity."""

    def __init__(self, entity: StubCalendarEntity) -> None:
        """Initialize stub component."""
        self._entity = entity

    def get_entity(self, entity_id: str) -> StubCalendarEntity | None:
        """Return the entity when the id matches."""
        if entity_id == "calendar.maint":
            return self._entity
        return None


@pytest.mark.asyncio
async def test_calendar_link_store_round_trip(hass: HomeAssistant) -> None:
    """Ensure calendar link store persists calendar and event ids."""
    store = CalendarLinkStore(hass)
    await store.async_load()

    await store.async_set_calendar_entity_id("entry1", "calendar.maint")
    await store.async_set_event_id("entry1", "task1", "evt-1")

    assert await store.async_get_calendar_entity_id("entry1") == "calendar.maint"
    assert await store.async_get_event_id("entry1", "task1") == "evt-1"

    await store.async_remove_event("entry1", "task1")
    assert await store.async_get_event_id("entry1", "task1") is None

    await store.async_remove_entry("entry1")
    assert await store.async_get_calendar_entity_id("entry1") is None


@pytest.mark.asyncio
async def test_calendar_link_store_missing_entries_return_none(
    hass: HomeAssistant,
) -> None:
    """Calendar link lookups should gracefully handle missing entries."""
    store = CalendarLinkStore(hass)

    assert await store.async_get_event_id("missing-entry", "task") is None
    assert await store.async_remove_event("missing-entry", "task") is None

    # Removing an unknown entry should be a no-op
    await store.async_remove_entry("missing-entry")


@pytest.mark.asyncio
async def test_calendar_sync_handles_task_lifecycle(hass: HomeAssistant) -> None:
    """Verify calendar sync creates, updates, and deletes events."""
    frame._hass.hass = hass
    frame.report_usage = lambda *_args, **_kwargs: None  # type: ignore[assignment]
    entity = StubCalendarEntity()
    hass.data[DATA_COMPONENT] = StubCalendarComponent(entity)

    store = CalendarLinkStore(hass)
    manager = CalendarSyncManager(hass, link_store=store)
    manager._async_ensure_calendar = AsyncMock(return_value="calendar.maint")  # type: ignore[attr-defined]

    entry = MagicMock()
    entry.entry_id = "entry1"
    entry.title = "Maint"
    entry.options = {CONF_SYNC_TO_CALENDAR: True, CONF_CALENDAR_NAME: "Maint"}

    recurrence = Recurrence(type="interval", every=1, unit="weeks")
    task = MaintTask(
        task_id="task1",
        description="Replace filters",
        last_completed=date(2024, 1, 1),
        recurrence=recurrence,
    )
    task_store = MagicMock()
    task_store.async_list_tasks = AsyncMock(return_value=[task])

    await manager.async_setup_entry(entry, task_store)
    event_id = manager._event_uid(entry.entry_id, task.task_id)  # type: ignore[arg-type]

    assert entity.created
    created_event = entity.created[0]
    assert created_event[EVENT_UID] == event_id
    assert created_event[EVENT_START] == task.next_scheduled
    assert created_event[EVENT_END] == task.next_scheduled + timedelta(days=1)
    assert await store.async_get_event_id(entry.entry_id, task.task_id) == event_id

    updated_task = MaintTask(
        task_id=task.task_id,
        description=task.description,
        last_completed=date(2024, 1, 8),
        recurrence=recurrence,
    )
    await manager._async_upsert_event(
        "calendar.maint", entry, updated_task, event_id, existing=event_id
    )
    assert entity.updated
    assert entity.updated[0][0] == event_id

    await store.async_remove_event(entry.entry_id, updated_task.task_id)
    await manager._async_delete_event("calendar.maint", event_id)
    assert entity.deleted
    assert entity.deleted[-1] == event_id
