"""Data models for the Maint integration."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import TypedDict
from uuid import uuid4

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

STORAGE_KEY = "maint.tasks"
STORAGE_VERSION = 1


class _UnsetType:
    """Sentinel type for unset optional values."""


UNSET = _UnsetType()


def _serialize_date(value: date) -> str:
    """Serialize a date value to an ISO formatted string."""

    return value.isoformat()


def _deserialize_date(value: str) -> date:
    """Deserialize an ISO date or datetime string."""
    d = dt_util.parse_date(value)
    if d is None:
        raise ValueError(f"Invalid date format: {value}")
    return d


@dataclass(slots=True)
class MaintTask:
    """Represent a recurring maintenance task."""

    task_id: str
    description: str
    last_completed: date
    frequency: int

    @property
    def next_scheduled(self) -> date:
        """Return the next scheduled date based on last completion and frequency."""
        return self.last_completed + timedelta(days=self.frequency)

    def to_dict(self) -> MaintTaskSerializedData:
        """Serialize the task for transport."""
        return {
            "task_id": self.task_id,
            "description": self.description,
            "last_completed": _serialize_date(self.last_completed),
            "frequency": self.frequency,
        }

    @classmethod
    def from_dict(cls, data: MaintTaskSerializedData) -> MaintTask:
        """Deserialize task data."""
        last_completed = _deserialize_date(data["last_completed"])
        frequency = data["frequency"]
        description = data["description"]

        return cls(
            task_id=data["task_id"],
            description=description,
            last_completed=last_completed,
            frequency=frequency,
        )


class MaintTaskSerializedData(TypedDict):
    """Serialized maintenance task."""

    task_id: str
    description: str
    last_completed: str
    frequency: int


class MaintTaskStoreData(TypedDict):
    """Storage schema for Maint tasks."""

    entries: dict[str, list[MaintTaskSerializedData]]


class MaintTaskStore:
    """Persistent storage for maintenance tasks."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the task store."""
        self._store: Store[MaintTaskStoreData] = Store(
            hass, STORAGE_VERSION, STORAGE_KEY, private=True
        )
        self._tasks: dict[str, dict[str, MaintTask]] = {}
        self._loaded = False

    async def async_load(self) -> None:
        """Load tasks from disk."""
        if self._loaded:
            return
        data = await self._store.async_load()
        if not data:
            self._tasks = {}
        else:
            entries = data.get("entries", {})
            tasks_by_entry: dict[str, dict[str, MaintTask]] = {}
            for entry_id, tasks in entries.items():
                entry_tasks: dict[str, MaintTask] = {}
                for task_data in tasks:
                    entry_tasks[task_data["task_id"]] = MaintTask.from_dict(task_data)
                tasks_by_entry[entry_id] = entry_tasks
            self._tasks = tasks_by_entry
        self._loaded = True

    async def _async_save(self) -> None:
        """Persist tasks to disk."""
        await self._store.async_save(
            {
                "entries": {
                    entry_id: [task.to_dict() for task in tasks.values()]
                    for entry_id, tasks in self._tasks.items()
                }
            }
        )

    async def _async_get_entry_tasks(self, entry_id: str) -> dict[str, MaintTask]:
        """Return the task mapping for an entry."""
        await self.async_load()
        return self._tasks.setdefault(entry_id, {})

    async def async_list_tasks(self, entry_id: str) -> list[MaintTask]:
        """Return all stored tasks for an entry."""
        tasks = await self._async_get_entry_tasks(entry_id)
        return list(tasks.values())

    async def async_create_task(
        self,
        entry_id: str,
        *,
        description: str,
        last_completed: date,
        frequency: int,
    ) -> MaintTask:
        """Create and store a new task."""
        self.validate(
            entry_id=entry_id,
            description=description,
            last_completed=last_completed,
            frequency=frequency,
        )

        tasks = await self._async_get_entry_tasks(entry_id)
        task = MaintTask(
            task_id=uuid4().hex,
            description=description,
            last_completed=last_completed,
            frequency=int(frequency),
        )
        tasks[task.task_id] = task
        await self._async_save()
        return task

    async def async_update_task(
        self,
        entry_id: str,
        task_id: str,
        *,
        description: str,
        last_completed: date,
        frequency: int,
    ) -> MaintTask:
        """Update an existing task."""
        self.validate(
            entry_id=entry_id,
            task_id=task_id,
            description=description,
            last_completed=last_completed,
            frequency=frequency,
        )

        tasks = await self._async_get_entry_tasks(entry_id)
        task = tasks[task_id]
        task.description = description
        task.last_completed = last_completed
        task.frequency = int(frequency)
        await self._async_save()
        return task

    async def async_delete_task(self, entry_id: str, task_id: str) -> MaintTask:
        """Delete and return a task."""
        self.validate(entry_id=entry_id, task_id=task_id)

        tasks = await self._async_get_entry_tasks(entry_id)
        task = tasks.pop(task_id)
        if not tasks:
            self._tasks.pop(entry_id, None)
        await self._async_save()
        return task

    async def async_get_task(self, entry_id: str, task_id: str) -> MaintTask:
        """Return a task by id."""
        self.validate(entry_id=entry_id, task_id=task_id)

        tasks = await self._async_get_entry_tasks(entry_id)
        return tasks[task_id]

    @classmethod
    def validate(
        cls,
        *,
        entry_id: str | None = None,
        task_id: str | None = None,
        description: str | None = None,
        frequency: int | None = None,
        last_completed: date | None = None,
    ) -> None:
        """Validate task parameters."""
        if entry_id is not None:
            if entry_id == "":
                raise ValueError("entry_id cannot be empty")

        if task_id is not None:
            if task_id == "":
                raise ValueError("task_id cannot be empty")

        if description is not None:
            if description == "":
                raise ValueError("description cannot be empty")

        if last_completed is not None:
            if last_completed == "":
                raise ValueError("last_completed cannot be empty")

        if frequency is not None:
            if frequency <= 0:
                raise ValueError("frequency must be greater than 0")


@dataclass(slots=True)
class MaintRuntimeData:
    """Runtime data stored on the config entry."""

    task_store: MaintTaskStore


type MaintConfigEntry = ConfigEntry[MaintRuntimeData]
