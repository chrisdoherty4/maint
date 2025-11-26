"""Sensor platform for Maint tasks."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import (
    DOMAIN,
    SIGNAL_TASK_CREATED,
    SIGNAL_TASK_DELETED,
    SIGNAL_TASK_UPDATED,
)
from .util import configured_sensor_prefix

if TYPE_CHECKING:
    from homeassistant.helpers.entity_platform import AddEntitiesCallback

    from .models import MaintConfigEntry, MaintTask

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: MaintConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up a Maint summary sensor for a config entry."""
    runtime_data = entry.runtime_data
    store = runtime_data.task_store
    tasks = await store.async_list_tasks(entry.entry_id)
    sensor = MaintTasksDueSensor(entry=entry, tasks=tasks)

    async_add_entities([sensor], update_before_add=True)

    @callback
    def handle_task_created(entry_id: str, task: MaintTask) -> None:
        """Update when a task is created."""
        if entry_id != entry.entry_id:
            return
        sensor.handle_task_created(task)

    @callback
    def handle_task_updated(entry_id: str, task: MaintTask) -> None:
        """Update when a task is modified."""
        if entry_id != entry.entry_id:
            return
        sensor.handle_task_updated(task)

    @callback
    def handle_task_deleted(entry_id: str, task: MaintTask) -> None:
        """Update when a task is removed."""
        if entry_id != entry.entry_id:
            return
        sensor.handle_task_deleted(task)

    entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_TASK_CREATED, handle_task_created)
    )
    entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_TASK_UPDATED, handle_task_updated)
    )
    entry.async_on_unload(
        async_dispatcher_connect(hass, SIGNAL_TASK_DELETED, handle_task_deleted)
    )


class MaintTasksDueSensor(SensorEntity):
    """Sensor counting due Maint binary sensors."""

    _attr_has_entity_name = True
    _attr_name = "Tasks due"

    def __init__(self, entry: MaintConfigEntry, tasks: list[MaintTask]) -> None:
        """Initialize the sensor."""
        self._entry = entry
        self._tasks: dict[str, MaintTask] = {task.task_id: task for task in tasks}
        self._attr_unique_id = f"{entry.entry_id}_tasks_due"
        self._attr_device_info = {
            "identifiers": {(DOMAIN, entry.entry_id)},
            "name": entry.title,
        }
        self._sensor_prefix = configured_sensor_prefix(entry)

    @property
    def suggested_object_id(self) -> str | None:
        """Use a stable object id for the summary sensor."""
        base = "tasks_due"
        return f"{self._sensor_prefix}_{base}" if self._sensor_prefix else base

    @property
    def native_value(self) -> int:
        """Return the number of due tasks."""
        return len(self._due_tasks())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return details about due tasks and their sensors."""
        due_tasks = [
            {
                "description": task.description,
                "binary_sensor": self._binary_sensor_entity_id(task),
            }
            for task in self._sorted_due_tasks()
        ]
        return {"due_tasks": due_tasks}

    def _due_tasks(self) -> list[MaintTask]:
        """Return tasks that are currently due."""
        return [task for task in self._tasks.values() if task.is_due]

    def _sorted_due_tasks(self) -> list[MaintTask]:
        """Return due tasks sorted by description for deterministic attributes."""
        return sorted(self._due_tasks(), key=lambda task: task.description.lower())

    def _binary_sensor_entity_id(self, task: MaintTask) -> str | None:
        """Return the entity_id for the binary sensor tied to a task."""
        if self.hass is None:
            return None
        registry = er.async_get(self.hass)
        unique_id = f"{self._entry.entry_id}_{task.task_id}"
        entity_id = registry.async_get_entity_id("binary_sensor", DOMAIN, unique_id)
        _LOGGER.debug(
            "Resolved binary sensor for task %s on entry %s to %s",
            task.task_id,
            self._entry.entry_id,
            entity_id,
        )
        return entity_id

    @callback
    def handle_task_created(self, task: MaintTask) -> None:
        """Add a new task to the sensor."""
        self._tasks[task.task_id] = task
        self.async_write_ha_state()

    @callback
    def handle_task_updated(self, task: MaintTask) -> None:
        """Update a stored task and refresh state."""
        self._tasks[task.task_id] = task
        self.async_write_ha_state()

    @callback
    def handle_task_deleted(self, task: MaintTask) -> None:
        """Remove a task and refresh state."""
        self._tasks.pop(task.task_id, None)
        self.async_write_ha_state()
