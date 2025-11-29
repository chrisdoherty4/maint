"""Data models for the Maint integration."""

from __future__ import annotations

import calendar
import logging
from dataclasses import dataclass
from datetime import date, timedelta
from typing import TYPE_CHECKING, Literal, NotRequired, TypedDict, cast
from uuid import uuid4

from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .domain import DOMAIN

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

SIGNAL_TASK_CREATED = "maint_task_created"
SIGNAL_TASK_UPDATED = "maint_task_updated"
SIGNAL_TASK_DELETED = "maint_task_deleted"

STORAGE_KEY = f"{DOMAIN}.store"
STORAGE_VERSION = 2

RecurrenceType = Literal["interval", "weekly"]
IntervalUnit = Literal["days", "weeks", "months"]
WeekdayIndex = Literal[0, 1, 2, 3, 4, 5, 6]

_LOGGER = logging.getLogger(__name__)


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


def _validate_weekday(value: int) -> WeekdayIndex:
    """Ensure a weekday index is within 0-6 (Monday=0)."""
    if value not in range(7):
        message = f"weekday must be between 0 and 6, got {value}"
        raise ValueError(message)
    return cast("WeekdayIndex", value)


def _last_day_of_month(year: int, month: int) -> int:
    """Return the final day number for the given month."""
    return calendar.monthrange(year, month)[1]


def _add_months(base: date, months: int) -> date:
    """Add a number of months to a date, clamping to month end."""
    total_months = (base.year * 12 + base.month - 1) + months
    target_year, month_index = divmod(total_months, 12)
    target_month = month_index + 1
    day = min(base.day, _last_day_of_month(target_year, target_month))
    return date(target_year, target_month, day)


def _nth_weekday_of_month(
    year: int, month: int, *, weekday: WeekdayIndex, occurrence: int
) -> date:
    """Return the nth weekday for a month (e.g., 2nd Tuesday)."""
    if occurrence < 1:
        message = "occurrence must be >= 1"
        raise ValueError(message)
    first_weekday, days_in_month = calendar.monthrange(year, month)
    offset = (weekday - first_weekday) % 7
    day = 1 + offset + (occurrence - 1) * 7
    if day > days_in_month:
        message = (
            f"{occurrence} occurrence for weekday {weekday} "
            f"does not exist in {year}-{month}"
        )
        raise ValueError(message)
    return date(year, month, day)


@dataclass(slots=True)
class Recurrence:
    """Recurrence rule for a maintenance task."""

    type: RecurrenceType
    every: int | None = None
    unit: IntervalUnit | None = None
    days_of_week: tuple[WeekdayIndex, ...] = ()
    week: int | None = None
    weekday: WeekdayIndex | None = None

    def to_dict(self) -> RecurrenceSerialized:
        """Serialize a recurrence rule."""
        if self.type == "interval":
            if self.every is None or self.unit is None:
                message = "Interval recurrence missing configuration"
                raise ValueError(message)
            return {"type": "interval", "every": self.every, "unit": self.unit}

        if self.type == "weekly":
            return {
                "type": "weekly",
                "days": list(self.days_of_week),
            }

        message = f"Unknown recurrence type: {self.type}"
        raise ValueError(message)

    @classmethod
    def from_dict(cls, data: RecurrenceSerialized) -> Recurrence:
        """Create a recurrence rule from serialized data."""
        recurrence_type = data.get("type")
        if recurrence_type == "interval":
            every = int(data["every"])
            unit = data["unit"]
            if every <= 0:
                message = "every must be greater than 0"
                raise ValueError(message)
            if unit not in ("days", "weeks", "months"):
                message = "unit must be one of days, weeks, months"
                raise ValueError(message)
            return cls(type="interval", every=every, unit=unit)

        if recurrence_type == "weekly":
            days_raw = data.get("days", [])
            if not isinstance(days_raw, list) or not days_raw:
                message = "weekly recurrence requires at least one day"
                raise ValueError(message)
            days: list[WeekdayIndex] = []
            for raw in days_raw:
                day = _validate_weekday(int(raw))
                days.append(day)
            unique_days = tuple(sorted(set(days)))
            return cls(type="weekly", days_of_week=unique_days)

        message = f"Unknown recurrence type: {recurrence_type}"
        raise ValueError(message)


class RecurrenceSerialized(TypedDict, total=False):
    """Serialized recurrence formats."""

    type: RecurrenceType
    every: int
    unit: IntervalUnit
    days: list[int]


def calculate_next_scheduled(last_completed: date, recurrence: Recurrence) -> date:
    """Dispatch recurrence calculation based on type."""
    if recurrence.type == "interval":
        return _next_interval(last_completed, recurrence)
    if recurrence.type == "weekly":
        return _next_weekly(last_completed, recurrence)
    message = f"Unknown recurrence type: {recurrence.type}"
    raise ValueError(message)


def _next_interval(last_completed: date, recurrence: Recurrence) -> date:
    """Calculate the next scheduled date after the provided completion date."""
    if recurrence.every is None or recurrence.unit is None:
        message = "Interval recurrence missing configuration"
        raise ValueError(message)

    if recurrence.unit == "months":
        return _add_months(last_completed, recurrence.every)

    days = recurrence.every if recurrence.unit == "days" else recurrence.every * 7
    return last_completed + timedelta(days=days)


def _next_weekly(last_completed: date, recurrence: Recurrence) -> date:
    """Calculate the next date for a weekly recurrence."""
    current_weekday = last_completed.weekday()
    for offset in range(1, 8):
        next_weekday = (current_weekday + offset) % 7
        if next_weekday in recurrence.days_of_week:
            return last_completed + timedelta(days=offset)

    return last_completed + timedelta(days=7)


@dataclass(slots=True)
class MaintTask:
    """Represent a recurring maintenance task."""

    task_id: str
    description: str
    last_completed: date
    recurrence: Recurrence

    @property
    def next_scheduled(self) -> date:
        """Return the next scheduled date after the last completion date."""
        return calculate_next_scheduled(self.last_completed, self.recurrence)

    @property
    def is_due(self) -> bool:
        """Return True if the task is due today or earlier."""
        today = dt_util.now().date()
        return today >= self.next_scheduled

    def to_dict(self) -> MaintTaskSerializedData:
        """Serialize the task for transport."""
        return {
            "task_id": self.task_id,
            "description": self.description,
            "last_completed": _serialize_date(self.last_completed),
            "recurrence": self.recurrence.to_dict(),
            "next_scheduled": _serialize_date(self.next_scheduled),
        }

    @classmethod
    def from_dict(cls, data: MaintTaskSerializedData) -> MaintTask:
        """Deserialize task data."""
        last_completed = _deserialize_date(data["last_completed"])
        description = data["description"]
        recurrence = Recurrence.from_dict(data["recurrence"])

        return cls(
            task_id=data["task_id"],
            description=description,
            last_completed=last_completed,
            recurrence=recurrence,
        )


class MaintTaskSerializedData(TypedDict):
    """Serialized maintenance task."""

    task_id: str
    description: str
    last_completed: str
    recurrence: RecurrenceSerialized
    next_scheduled: NotRequired[str]


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
        _LOGGER.debug("Loading Maint tasks from storage")
        data = await self._store.async_load()
        entries = data.get("entries", {}) if data else {}
        self._tasks = {
            entry_id: {
                task_data["task_id"]: MaintTask.from_dict(task_data)
                for task_data in tasks
            }
            for entry_id, tasks in entries.items()
        }
        entries_count, tasks_count = self._counts()
        _LOGGER.debug(
            "Loaded Maint task store: %s entries, %s tasks",
            entries_count,
            tasks_count,
        )
        self._loaded = True

    async def _async_save(self) -> None:
        """Persist tasks to disk."""
        entries_count, tasks_count = self._counts()
        await self._store.async_save(
            {
                "entries": {
                    entry_id: [task.to_dict() for task in tasks.values()]
                    for entry_id, tasks in self._tasks.items()
                }
            }
        )
        _LOGGER.debug(
            "Saved Maint tasks: %s entries, %s tasks",
            entries_count,
            tasks_count,
        )

    def _counts(self) -> tuple[int, int]:
        """Return counts of entries and tasks for logging."""
        return len(self._tasks), sum(len(tasks) for tasks in self._tasks.values())

    async def _async_get_entry_tasks(self, entry_id: str) -> dict[str, MaintTask]:
        """Return the task mapping for an entry."""
        await self.async_load()
        if entry_id not in self._tasks:
            _LOGGER.debug("Initialized Maint task list for entry %s", entry_id)
        return self._tasks.setdefault(entry_id, {})

    async def async_list_tasks(self, entry_id: str) -> list[MaintTask]:
        """Return all stored tasks for an entry."""
        tasks = await self._async_get_entry_tasks(entry_id)
        _LOGGER.debug(
            "Listing Maint tasks for entry %s (%s tasks)", entry_id, len(tasks)
        )
        return list(tasks.values())

    async def async_create_task(
        self,
        entry_id: str,
        *,
        description: str,
        last_completed: date,
        recurrence: Recurrence,
    ) -> MaintTask:
        """Create and store a new task."""
        self.validate(
            entry_id=entry_id,
            description=description,
            last_completed=last_completed,
            recurrence=recurrence,
        )

        tasks = await self._async_get_entry_tasks(entry_id)
        task = MaintTask(
            task_id=uuid4().hex,
            description=description,
            last_completed=last_completed,
            recurrence=recurrence,
        )
        tasks[task.task_id] = task
        await self._async_save()
        async_dispatcher_send(
            self._hass, SIGNAL_TASK_CREATED, entry_id, tasks[task.task_id]
        )
        _LOGGER.debug(
            "Created Maint task %s for entry %s (freq=%s %s)",
            task.task_id,
            entry_id,
            task.recurrence.type,
            task.next_scheduled,
        )
        return task

    async def async_update_task(
        self,
        entry_id: str,
        task_id: str,
        *,
        description: str,
        last_completed: date,
        recurrence: Recurrence,
    ) -> MaintTask:
        """Update an existing task."""
        self.validate(
            entry_id=entry_id,
            task_id=task_id,
            description=description,
            last_completed=last_completed,
            recurrence=recurrence,
        )

        tasks = await self._async_get_entry_tasks(entry_id)
        task = tasks[task_id]
        task.description = description
        task.last_completed = last_completed
        task.recurrence = recurrence
        await self._async_save()
        async_dispatcher_send(self._hass, SIGNAL_TASK_UPDATED, entry_id, task)
        _LOGGER.debug(
            "Updated Maint task %s for entry %s (freq=%s %s)",
            task_id,
            entry_id,
            task.recurrence.type,
            task.next_scheduled,
        )
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
        _LOGGER.debug("Deleted Maint task %s for entry %s", task.task_id, entry_id)
        return task

    async def async_get_task(self, entry_id: str, task_id: str) -> MaintTask:
        """Return a task by id."""
        self.validate(entry_id=entry_id, task_id=task_id)

        tasks = await self._async_get_entry_tasks(entry_id)
        _LOGGER.debug("Fetching Maint task %s for entry %s", task_id, entry_id)
        return tasks[task_id]

    @classmethod
    def validate(
        cls,
        *,
        entry_id: str | None = None,
        task_id: str | None = None,
        description: str | None = None,
        last_completed: date | None = None,
        recurrence: Recurrence | None = None,
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

        if last_completed is not None and not isinstance(last_completed, date):
            message = "last_completed must be a date"
            raise ValueError(message)

        if recurrence is not None and not isinstance(recurrence, Recurrence):
            message = "recurrence must be provided"
            raise ValueError(message)


@dataclass(slots=True)
class MaintRuntimeData:
    """Runtime data stored on the config entry."""

    task_store: MaintTaskStore


type MaintConfigEntry = ConfigEntry[MaintRuntimeData]
