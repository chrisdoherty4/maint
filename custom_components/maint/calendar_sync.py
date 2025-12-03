"""Calendar synchronization for Maint tasks."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.components.calendar.const import (
    DATA_COMPONENT,
    EVENT_DESCRIPTION,
    EVENT_END,
    EVENT_START,
    EVENT_SUMMARY,
    EVENT_UID,
    CalendarEntityFeature,
)
from homeassistant.components.calendar.const import (
    DOMAIN as CALENDAR_DOMAIN,
)
from homeassistant.config_entries import SOURCE_USER, ConfigEntry, ConfigEntryState
from homeassistant.const import Platform
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.util import slugify

from .calendar_store import CalendarLinkStore
from .domain import DOMAIN
from .models import (
    SIGNAL_TASK_CREATED,
    SIGNAL_TASK_DELETED,
    SIGNAL_TASK_UPDATED,
    MaintConfigEntry,
    MaintTask,
    MaintTaskStore,
)

if TYPE_CHECKING:
    from homeassistant.core import CALLBACK_TYPE, HomeAssistant
    from homeassistant.helpers.entity import Entity

LOCAL_CALENDAR_DOMAIN = "local_calendar"

DEFAULT_CALENDAR_NAME = "Maint"

CONF_SYNC_TO_CALENDAR = "sync_to_calendar"
CONF_CALENDAR_NAME = "calendar_name"

_LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class CalendarOptions:
    """Calendar sync configuration."""

    enabled: bool
    calendar_name: str


class CalendarSyncManager:
    """Manage syncing Maint tasks to Home Assistant calendars."""

    def __init__(
        self, hass: HomeAssistant, link_store: CalendarLinkStore | None = None
    ) -> None:
        """Initialize the manager."""
        self._hass = hass
        self._link_store = link_store or CalendarLinkStore(hass)
        self._unsubscribers: dict[str, list[CALLBACK_TYPE]] = {}

    async def async_load(self) -> None:
        """Load persistent storage."""
        await self._link_store.async_load()

    async def async_setup_entry(
        self, entry: MaintConfigEntry, task_store: MaintTaskStore
    ) -> None:
        """Configure calendar sync for an entry based on options."""
        await self.async_load()
        await self._async_remove_listeners(entry.entry_id)

        options = _parse_calendar_options(entry)
        if not options.enabled:
            await self._async_cleanup_entry_events(entry.entry_id)
            return

        calendar_entity_id = await self._async_ensure_calendar(options.calendar_name)
        await self._link_store.async_set_calendar_entity_id(
            entry.entry_id, calendar_entity_id
        )

        tasks = await task_store.async_list_tasks(entry.entry_id)
        await self._async_reconcile_tasks(entry, calendar_entity_id, tasks)
        self._async_listen_for_updates(entry, calendar_entity_id)

    async def async_unload_entry(self, entry_id: str) -> None:
        """Remove listeners for an entry when the config entry unloads."""
        await self._async_remove_listeners(entry_id)

    async def async_remove_entry(self, entry_id: str) -> None:
        """Remove stored data and calendar events for an entry."""
        await self._async_cleanup_entry_events(entry_id)
        await self._link_store.async_remove_entry(entry_id)
        await self._async_remove_listeners(entry_id)

    async def _async_reconcile_tasks(
        self,
        entry: MaintConfigEntry,
        calendar_entity_id: str,
        tasks: list[MaintTask],
    ) -> None:
        """Ensure calendar events match current tasks."""
        stored = await self._link_store.async_list_events(entry.entry_id)
        seen: set[str] = set()

        for task in tasks:
            stored_event_id = stored.get(task.task_id)
            event_id = stored_event_id or self._event_uid(entry.entry_id, task.task_id)
            await self._async_upsert_event(
                calendar_entity_id, entry, task, event_id, existing=stored_event_id
            )
            await self._link_store.async_set_event_id(
                entry.entry_id, task.task_id, event_id
            )
            seen.add(task.task_id)

        for task_id, event_id in stored.items():
            if task_id in seen:
                continue
            await self._async_delete_event(calendar_entity_id, event_id)
            await self._link_store.async_remove_event(entry.entry_id, task_id)

    def _async_listen_for_updates(
        self, entry: MaintConfigEntry, calendar_entity_id: str
    ) -> None:
        """Listen for task lifecycle events to keep the calendar in sync."""
        hass = self._hass

        async def _handle_created(entry_id: str, task: MaintTask) -> None:
            if entry_id != entry.entry_id:
                return
            event_id = self._event_uid(entry.entry_id, task.task_id)
            await self._async_upsert_event(
                calendar_entity_id, entry, task, event_id, existing=None
            )
            await self._link_store.async_set_event_id(
                entry.entry_id, task.task_id, event_id
            )

        async def _handle_updated(entry_id: str, task: MaintTask) -> None:
            if entry_id != entry.entry_id:
                return
            stored_event_id = await self._link_store.async_get_event_id(
                entry.entry_id, task.task_id
            )
            event_id = stored_event_id or self._event_uid(entry.entry_id, task.task_id)
            await self._async_upsert_event(
                calendar_entity_id, entry, task, event_id, existing=stored_event_id
            )
            await self._link_store.async_set_event_id(
                entry.entry_id, task.task_id, event_id
            )

        async def _handle_deleted(entry_id: str, task: MaintTask) -> None:
            if entry_id != entry.entry_id:
                return
            stored_event_id = await self._link_store.async_remove_event(
                entry.entry_id, task.task_id
            )
            if stored_event_id is None:
                stored_event_id = self._event_uid(entry.entry_id, task.task_id)
            await self._async_delete_event(calendar_entity_id, stored_event_id)

        unsub_create = async_dispatcher_connect(
            hass, SIGNAL_TASK_CREATED, _handle_created
        )
        unsub_update = async_dispatcher_connect(
            hass, SIGNAL_TASK_UPDATED, _handle_updated
        )
        unsub_delete = async_dispatcher_connect(
            hass, SIGNAL_TASK_DELETED, _handle_deleted
        )

        self._unsubscribers[entry.entry_id] = [
            unsub_create,
            unsub_update,
            unsub_delete,
        ]

    async def _async_remove_listeners(self, entry_id: str) -> None:
        """Cancel dispatcher listeners for an entry."""
        if unsub := self._unsubscribers.pop(entry_id, None):
            for cancel in unsub:
                cancel()

    async def _async_ensure_calendar(self, calendar_name: str) -> str:
        """Return an entity_id for the target calendar, creating it if missing."""
        entity_id = await self._async_find_calendar(calendar_name)
        if entity_id:
            _LOGGER.debug("Using existing calendar %s for Maint sync", entity_id)
            return entity_id

        entry = self._async_find_local_calendar_entry(calendar_name)
        if entry is None:
            _LOGGER.info(
                "Creating local calendar '%s' for Maint sync because it was not found",
                calendar_name,
            )
            result = await self._hass.config_entries.flow.async_init(
                LOCAL_CALENDAR_DOMAIN,
                context={"source": SOURCE_USER},
                data={"calendar_name": calendar_name},
            )
            if result["type"] is FlowResultType.CREATE_ENTRY:
                entry = result["result"]
            elif result["type"] is FlowResultType.ABORT:
                entry = self._async_find_local_calendar_entry(calendar_name)
            else:
                message = f"Failed to create calendar: {result}"
                raise HomeAssistantError(message)

        await self._async_ensure_entry_setup(entry)
        resolved_entity = await self._async_resolve_calendar_entity_id(entry)
        _LOGGER.debug(
            "Resolved calendar %s to entity %s for Maint sync",
            calendar_name,
            resolved_entity,
        )
        return resolved_entity

    def _async_find_local_calendar_entry(
        self, calendar_name: str
    ) -> ConfigEntry | None:
        """Find an existing Local Calendar entry by slugified name."""
        slug = slugify(calendar_name)
        for entry in self._hass.config_entries.async_entries(LOCAL_CALENDAR_DOMAIN):
            entry_slug = slugify(entry.data.get("calendar_name", ""))
            if entry_slug == slug:
                return entry
        return None

    async def _async_ensure_entry_setup(self, entry: ConfigEntry) -> None:
        """Ensure the Local Calendar entry is set up."""
        if entry.state is ConfigEntryState.LOADED:
            return
        await self._hass.config_entries.async_setup(entry.entry_id)

    async def _async_resolve_calendar_entity_id(self, entry: ConfigEntry) -> str:
        """Return the calendar entity id for a Local Calendar entry."""
        registry = er.async_get(self._hass)
        entities = er.async_entries_for_config_entry(registry, entry.entry_id)
        for entity in entities:
            if entity.domain == Platform.CALENDAR:
                return entity.entity_id

        # If entities are not yet registered, give the platform a moment to finish
        # setup.
        for _ in range(3):
            await asyncio.sleep(0)
            entities = er.async_entries_for_config_entry(registry, entry.entry_id)
            for entity in entities:
                if entity.domain == Platform.CALENDAR:
                    return entity.entity_id

        message = f"Calendar entity for entry {entry.entry_id} not found"
        raise HomeAssistantError(message)

    async def _async_find_calendar(self, calendar_name: str) -> str | None:
        """Locate an existing calendar entity by slugified name or friendly name."""
        registry = er.async_get(self._hass)
        slug_id = f"{CALENDAR_DOMAIN}.{slugify(calendar_name)}"
        if registry.async_get(slug_id):
            return slug_id

        for entity in registry.entities.values():
            if entity.domain != CALENDAR_DOMAIN:
                continue
            if (
                entity.original_name
                and entity.original_name.lower() == calendar_name.lower()
            ):
                return entity.entity_id
        return None

    async def _async_upsert_event(
        self,
        calendar_entity_id: str,
        entry: MaintConfigEntry,
        task: MaintTask,
        event_id: str,
        *,
        existing: str | None,
    ) -> None:
        """Create or update a calendar event for a task."""
        entity = self._async_get_calendar_entity(calendar_entity_id)
        if entity is None:
            _LOGGER.warning(
                "Calendar entity %s not available; skipping sync for task %s",
                calendar_entity_id,
                task.task_id,
            )
            return

        start = task.next_scheduled
        end = start + timedelta(days=1)
        event: dict[str, Any] = {
            EVENT_UID: event_id,
            EVENT_START: start,
            EVENT_END: end,
            EVENT_SUMMARY: task.description,
            EVENT_DESCRIPTION: self._event_description(task),
        }

        try:
            if existing:
                if not entity.supported_features & CalendarEntityFeature.UPDATE_EVENT:
                    _LOGGER.debug(
                        "Calendar %s does not support updates; skipping event %s",
                        calendar_entity_id,
                        existing,
                    )
                    return
                await entity.async_update_event(event_id, event)
                _LOGGER.debug(
                    "Updated calendar event %s for Maint task %s on entry %s",
                    event_id,
                    task.task_id,
                    entry.entry_id,
                )
            else:
                if not entity.supported_features & CalendarEntityFeature.CREATE_EVENT:
                    _LOGGER.debug(
                        "Calendar %s does not support creation; skipping task %s",
                        calendar_entity_id,
                        task.task_id,
                    )
                    return
                await entity.async_create_event(**event)
                _LOGGER.debug(
                    "Created calendar event %s for Maint task %s on entry %s",
                    event_id,
                    task.task_id,
                    entry.entry_id,
                )
        except HomeAssistantError:
            _LOGGER.exception(
                "Unable to sync Maint task %s to calendar %s",
                task.task_id,
                calendar_entity_id,
            )

    async def _async_delete_event(
        self, calendar_entity_id: str, event_id: str | None
    ) -> None:
        """Delete an event from the calendar."""
        if event_id is None:
            return

        entity = self._async_get_calendar_entity(calendar_entity_id)
        if entity is None:
            _LOGGER.debug(
                "Calendar entity %s not available when deleting event %s",
                calendar_entity_id,
                event_id,
            )
            return

        if not entity.supported_features & CalendarEntityFeature.DELETE_EVENT:
            _LOGGER.debug(
                "Calendar entity %s does not support deletion; skipping removal for "
                "event %s",
                calendar_entity_id,
                event_id,
            )
            return

        try:
            await entity.async_delete_event(event_id)
            _LOGGER.debug(
                "Deleted calendar event %s from calendar %s",
                event_id,
                calendar_entity_id,
            )
        except HomeAssistantError:
            _LOGGER.exception(
                "Failed to delete calendar event %s from %s",
                event_id,
                calendar_entity_id,
            )

    async def _async_cleanup_entry_events(self, entry_id: str) -> None:
        """Remove tracked events when calendar sync is disabled."""
        entity_id = await self._link_store.async_get_calendar_entity_id(entry_id)
        if entity_id is None:
            await self._link_store.async_remove_entry(entry_id)
            return

        stored_events = await self._link_store.async_list_events(entry_id)
        for event_id in stored_events.values():
            await self._async_delete_event(entity_id, event_id)
        await self._link_store.async_remove_entry(entry_id)

    def _async_get_calendar_entity(self, entity_id: str) -> Entity | None:
        """Return the calendar entity object if loaded."""
        component = self._hass.data.get(DATA_COMPONENT)
        if component is None:
            _LOGGER.debug("Calendar component not initialized; cannot sync events")
            return None
        return component.get_entity(entity_id)

    @staticmethod
    def _event_uid(entry_id: str, task_id: str) -> str:
        """Generate a deterministic event id for a task."""
        return f"{DOMAIN}_{entry_id}_{task_id}"

    @staticmethod
    def _event_description(task: MaintTask) -> str:
        """Build the calendar event description."""
        next_date = task.next_scheduled
        return (
            f"Maint task '{task.description}' is scheduled for {next_date.isoformat()}."
            f" Last completed: {task.last_completed.isoformat()}."
        )


def _parse_calendar_options(entry: MaintConfigEntry) -> CalendarOptions:
    """Read calendar sync options from the config entry."""
    options = entry.options
    enabled = bool(options.get(CONF_SYNC_TO_CALENDAR, False))
    calendar_name = str(options.get(CONF_CALENDAR_NAME, DEFAULT_CALENDAR_NAME)).strip()
    if not calendar_name:
        calendar_name = DEFAULT_CALENDAR_NAME
    return CalendarOptions(enabled=enabled, calendar_name=calendar_name)
