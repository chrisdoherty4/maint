"""Binary sensor platform for Maint tasks."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.util import dt as dt_util

from .const import (
    DOMAIN,
    SIGNAL_TASK_CREATED,
    SIGNAL_TASK_DELETED,
    SIGNAL_TASK_UPDATED,
)

if TYPE_CHECKING:
    from homeassistant.helpers.entity_platform import AddEntitiesCallback

    from .models import MaintConfigEntry, MaintTask


async def async_setup_entry(
    hass: HomeAssistant,
    entry: MaintConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Maint task binary sensors for a config entry."""
    runtime_data = entry.runtime_data
    store = runtime_data.task_store
    tasks = await store.async_list_tasks(entry.entry_id)

    entities: dict[str, MaintTaskBinarySensor] = {}
    async_add_entities(
        [
            entities.setdefault(
                task.task_id, MaintTaskBinarySensor(entry=entry, task=task)
            )
            for task in tasks
        ]
    )

    @callback
    def handle_task_created(entry_id: str, task: MaintTask) -> None:
        """Create a sensor when a new task is added."""
        if entry_id != entry.entry_id:
            return
        if task.task_id in entities:
            entities[task.task_id].handle_task_update(task)
            return
        entity = MaintTaskBinarySensor(entry=entry, task=task)
        entities[task.task_id] = entity
        async_add_entities([entity])

    @callback
    def handle_task_updated(entry_id: str, task: MaintTask) -> None:
        """Update an existing sensor when a task is modified."""
        if entry_id != entry.entry_id:
            return
        if entity := entities.get(task.task_id):
            entity.handle_task_update(task)
            return
        entity = MaintTaskBinarySensor(entry=entry, task=task)
        entities[task.task_id] = entity
        async_add_entities([entity])

    @callback
    def handle_task_deleted(entry_id: str, task: MaintTask) -> None:
        """Remove a sensor when its task is deleted."""
        if entry_id != entry.entry_id:
            return
        entity = entities.pop(task.task_id, None)
        if entity is None:
            return
        hass.async_create_task(entity.async_remove())

    entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_TASK_CREATED, handle_task_created)
    )
    entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_TASK_UPDATED, handle_task_updated)
    )
    entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_TASK_DELETED, handle_task_deleted)
    )


class MaintTaskBinarySensor(BinarySensorEntity):
    """Binary sensor representing if a maintenance task is due."""

    _attr_has_entity_name = True

    def __init__(self, entry: MaintConfigEntry, task: MaintTask) -> None:
        """Initialize the binary sensor."""
        self._entry = entry
        self._task = task
        self._attr_unique_id = f"{entry.entry_id}_{task.task_id}"
        self._attr_name = task.description
        self._attr_device_info = {
            "identifiers": {(DOMAIN, entry.entry_id)},
            "name": entry.title,
        }

    @property
    def is_on(self) -> bool:
        """Return True when the maintenance task is due."""
        today = dt_util.now().date()
        return today >= self._task.next_scheduled

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return extra state data."""
        return {
            "description": self._task.description,
            "last_completed": self._task.last_completed.isoformat(),
            "frequency": self._task.frequency,
        }

    @callback
    def handle_task_update(self, task: MaintTask) -> None:
        """Refresh the sensor when the underlying task changes."""
        self._task = task
        self._attr_name = task.description
        self.async_write_ha_state()
