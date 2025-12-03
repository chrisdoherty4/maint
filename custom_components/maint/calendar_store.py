"""Storage for Maint calendar sync metadata."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, TypedDict

from homeassistant.helpers.storage import Store

from .domain import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = f"{DOMAIN}.calendar"
STORAGE_VERSION = 1


class CalendarEntryLinks(TypedDict, total=False):
    """Stored calendar link metadata for a Maint entry."""

    calendar_entity_id: str | None
    events: dict[str, str]


class CalendarSyncStoreData(TypedDict):
    """Serialized calendar sync data."""

    entries: dict[str, CalendarEntryLinks]


class CalendarLinkStore:
    """Persist mapping between Maint tasks and calendar events."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the calendar link store."""
        self._store: Store[CalendarSyncStoreData] = Store(
            hass, STORAGE_VERSION, STORAGE_KEY, private=True
        )
        self._data: CalendarSyncStoreData = {"entries": {}}
        self._loaded = False

    async def async_load(self) -> None:
        """Load stored calendar links."""
        if self._loaded:
            return
        data = await self._store.async_load() or {"entries": {}}
        self._data = data
        _LOGGER.debug(
            "Loaded Maint calendar link store (%s entries)", len(self._data["entries"])
        )
        self._loaded = True

    async def _async_save(self) -> None:
        """Persist calendar links to disk."""
        await self._store.async_save(self._data)
        _LOGGER.debug(
            "Saved Maint calendar link store (%s entries)", len(self._data["entries"])
        )

    async def async_get_calendar_entity_id(self, entry_id: str) -> str | None:
        """Return the calendar entity ID associated with an entry."""
        await self.async_load()
        return self._data["entries"].get(entry_id, {}).get("calendar_entity_id")

    async def async_set_calendar_entity_id(self, entry_id: str, entity_id: str) -> None:
        """Persist the calendar entity ID for an entry."""
        await self.async_load()
        entry_links = self._data["entries"].setdefault(entry_id, {})
        entry_links["calendar_entity_id"] = entity_id
        await self._async_save()

    async def async_get_event_id(self, entry_id: str, task_id: str) -> str | None:
        """Return the stored event id for a task."""
        await self.async_load()
        entry_links = self._data["entries"].get(entry_id)
        if entry_links is None:
            return None
        return entry_links.get("events", {}).get(task_id)

    async def async_set_event_id(
        self, entry_id: str, task_id: str, event_id: str
    ) -> None:
        """Persist the event id for a task."""
        await self.async_load()
        entry_links = self._data["entries"].setdefault(entry_id, {})
        events = entry_links.setdefault("events", {})
        events[task_id] = event_id
        await self._async_save()

    async def async_remove_event(self, entry_id: str, task_id: str) -> str | None:
        """Remove a stored event id for a task."""
        await self.async_load()
        entry_links = self._data["entries"].get(entry_id)
        if entry_links is None or "events" not in entry_links:
            return None
        removed = entry_links["events"].pop(task_id, None)
        if not entry_links["events"]:
            entry_links.pop("events", None)
        await self._async_save()
        return removed

    async def async_list_events(self, entry_id: str) -> dict[str, str]:
        """Return all stored event ids for an entry."""
        await self.async_load()
        entry_links = self._data["entries"].get(entry_id, {})
        return dict(entry_links.get("events", {}))

    async def async_remove_entry(self, entry_id: str) -> None:
        """Remove all stored data for an entry."""
        await self.async_load()
        removed = self._data["entries"].pop(entry_id, None)
        if removed is None:
            return
        await self._async_save()
