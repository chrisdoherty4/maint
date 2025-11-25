"""Data models for the Maint integration."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import TYPE_CHECKING, Literal, NotRequired, TypedDict
from uuid import uuid4

from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import (
    SIGNAL_TASK_CREATED,
    SIGNAL_TASK_DELETED,
    SIGNAL_TASK_UPDATED,
)

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

STORAGE_KEY = "maint.tasks"
STORAGE_VERSION = 1
FREQUENCY_UNIT_DAYS: Literal["days"] = "days"
FREQUENCY_UNIT_WEEKS: Literal["weeks"] = "weeks"
FREQUENCY_UNIT_MONTHS: Literal["months"] = "months"
FREQUENCY_UNITS = (
    FREQUENCY_UNIT_DAYS,
    FREQUENCY_UNIT_WEEKS,
    FREQUENCY_UNIT_MONTHS,
)
FrequencyUnit = Literal["days", "weeks", "months"]


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
        message = f"Invalid date format: {value}"
        raise ValueError(message)
    return d


@dataclass(slots=True)
class MaintTask:
    """Represent a recurring maintenance task."""

    task_id: str
    description: str
    last_completed: date
    frequency: int
    frequency_unit: FrequencyUnit = FREQUENCY_UNIT_DAYS

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
            "frequency_unit": self.frequency_unit,
        }

    @classmethod
    def from_dict(cls, data: MaintTaskSerializedData) -> MaintTask:
        """Deserialize task data."""
        last_completed = _deserialize_date(data["last_completed"])
        frequency = data["frequency"]
        description = data["description"]
        frequency_unit = data.get("frequency_unit", FREQUENCY_UNIT_DAYS)

        return cls(
            task_id=data["task_id"],
            description=description,
            last_completed=last_completed,
            frequency=frequency,
            frequency_unit=frequency_unit,
        )


class MaintTaskSerializedData(TypedDict):
    """Serialized maintenance task."""

    task_id: str
    description: str
    last_completed: str
    frequency: int
    frequency_unit: NotRequired[FrequencyUnit]


class MaintTaskStoreData(TypedDict):
    """Storage schema for Maint tasks."""

    entries: dict[str, list[MaintTaskSerializedData]]


class MaintTaskStore:
    """Persistent storage for maintenance tasks."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the task store."""
        self._hass = hass
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
        frequency_unit: FrequencyUnit = FREQUENCY_UNIT_DAYS,
    ) -> MaintTask:
        """Create and store a new task."""
        self.validate(
            entry_id=entry_id,
            description=description,
            last_completed=last_completed,
            frequency=frequency,
            frequency_unit=frequency_unit,
        )

        tasks = await self._async_get_entry_tasks(entry_id)
        task = MaintTask(
            task_id=uuid4().hex,
            description=description,
            last_completed=last_completed,
            frequency=int(frequency),
            frequency_unit=frequency_unit,
        )
        tasks[task.task_id] = task
        await self._async_save()
        async_dispatcher_send(
            self._hass, SIGNAL_TASK_CREATED, entry_id, tasks[task.task_id]
        )
        return task

    async def async_update_task(  # noqa: PLR0913
        self,
        entry_id: str,
        task_id: str,
        *,
        description: str,
        last_completed: date,
        frequency: int,
        frequency_unit: FrequencyUnit = FREQUENCY_UNIT_DAYS,
    ) -> MaintTask:
        """Update an existing task."""
        self.validate(
            entry_id=entry_id,
            task_id=task_id,
            description=description,
            last_completed=last_completed,
            frequency=frequency,
            frequency_unit=frequency_unit,
        )

        tasks = await self._async_get_entry_tasks(entry_id)
        task = tasks[task_id]
        task.description = description
        task.last_completed = last_completed
        task.frequency = int(frequency)
        task.frequency_unit = frequency_unit
        await self._async_save()
        async_dispatcher_send(self._hass, SIGNAL_TASK_UPDATED, entry_id, task)
        return task

    async def async_delete_task(self, entry_id: str, task_id: str) -> MaintTask:
        """Delete and return a task."""
        self.validate(entry_id=entry_id, task_id=task_id)

        tasks = await self._async_get_entry_tasks(entry_id)
        task = tasks.pop(task_id)
        if not tasks:
            self._tasks.pop(entry_id, None)
        await self._async_save()
        async_dispatcher_send(self._hass, SIGNAL_TASK_DELETED, entry_id, task)
        return task

    async def async_get_task(self, entry_id: str, task_id: str) -> MaintTask:
        """Return a task by id."""
        self.validate(entry_id=entry_id, task_id=task_id)

        tasks = await self._async_get_entry_tasks(entry_id)
        return tasks[task_id]

    @classmethod
    def validate(  # noqa: PLR0913
        cls,
        *,
        entry_id: str | None = None,
        task_id: str | None = None,
        description: str | None = None,
        frequency: int | None = None,
        last_completed: date | None = None,
        frequency_unit: FrequencyUnit | None = None,
    ) -> None:
        """Validate task parameters."""
        if entry_id is not None and entry_id == "":
            message = "entry_id cannot be empty"
            raise ValueError(message)

        if task_id is not None and task_id == "":
            message = "task_id cannot be empty"
            raise ValueError(message)

        if description is not None and description == "":
            message = "description cannot be empty"
            raise ValueError(message)

        if last_completed is not None and last_completed == "":
            message = "last_completed cannot be empty"
            raise ValueError(message)

        if frequency is not None and frequency <= 0:
            message = "frequency must be greater than 0"
            raise ValueError(message)

        if frequency_unit is not None and frequency_unit not in FREQUENCY_UNITS:
            message = f"frequency_unit must be one of {', '.join(FREQUENCY_UNITS)}"
            raise ValueError(message)


@dataclass(slots=True)
class MaintRuntimeData:
    """Runtime data stored on the config entry."""

    task_store: MaintTaskStore


type MaintConfigEntry = ConfigEntry[MaintRuntimeData]
