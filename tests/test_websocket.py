# ruff: noqa: S101
"""Tests for Maint websocket utility helpers."""

from __future__ import annotations

import pytest
import voluptuous as vol
from homeassistant.config_entries import ConfigEntryState

from custom_components.maint.domain import DOMAIN
from custom_components.maint.models import MaintRuntimeData
from custom_components.maint.websocket import (
    _normalized_labels,
    _parse_recurrence,
    _resolve_task_store,
    _validated_description,
)


def test_validated_description_trims_and_accepts_text() -> None:
    """Whitespace should be stripped and non-empty results accepted."""
    assert _validated_description("  Hello  ") == "Hello"


def test_validated_description_rejects_empty() -> None:
    """Empty or whitespace-only descriptions should raise."""
    with pytest.raises(vol.Invalid):
        _validated_description("   ")


def test_parse_recurrence_normalizes_weekly_days() -> None:
    """Recurrence parsing should sort and de-dupe weekly days."""
    recurrence = _parse_recurrence({"type": "weekly", "days": [5, 1, 1]})

    assert recurrence.type == "weekly"
    assert recurrence.every == 1
    assert recurrence.days_of_week == (1, 5)


def test_parse_recurrence_keeps_week_interval() -> None:
    """Recurrence parsing should preserve the weekly cadence."""
    interval_weeks = 3
    recurrence = _parse_recurrence(
        {"type": "weekly", "every": interval_weeks, "days": [0]}
    )

    assert recurrence.every == interval_weeks


def test_normalized_labels_trims_and_deduplicates() -> None:
    """Label normalization should trim whitespace and remove empties."""
    labels = _normalized_labels([" kitchen ", "garage", "", "garage"])

    assert labels == {"kitchen", "garage"}


def test_normalized_labels_returns_none_when_absent() -> None:
    """Missing label payloads should be returned as None."""
    assert _normalized_labels(None) is None


class _DummyConnection:
    """Capture websocket errors for assertions."""

    def __init__(self) -> None:
        self.errors: list[tuple[int, str, str]] = []

    def send_error(self, request_id: int, code: str, message: str) -> None:
        self.errors.append((request_id, code, message))


class _DummyConfigEntries:
    """Provide async_get_entry for websocket helpers."""

    def __init__(self, entry: object | None) -> None:
        self._entry = entry

    def async_get_entry(self, entry_id: str) -> object | None:
        if self._entry and getattr(self._entry, "entry_id", None) == entry_id:
            return self._entry
        return None


def test_resolve_task_store_handles_missing_entry() -> None:
    """Requests for unknown entries should send an error and return None."""
    hass = type(
        "Hass",
        (),
        {"config_entries": _DummyConfigEntries(entry=None)},
    )()
    connection = _DummyConnection()
    msg = {"id": 1, "entry_id": "missing", "type": "maint/task/list"}

    assert _resolve_task_store(hass, connection, msg) is None
    assert connection.errors[0][1] == "entry_not_found"


def test_resolve_task_store_handles_not_loaded_entry() -> None:
    """Unloaded entries should result in an error."""
    entry = type(
        "Entry",
        (),
        {
            "entry_id": "entry-1",
            "domain": DOMAIN,
            "state": ConfigEntryState.NOT_LOADED,
            "runtime_data": MaintRuntimeData(task_store=None),  # type: ignore[arg-type]
        },
    )()
    hass = type(
        "Hass",
        (),
        {"config_entries": _DummyConfigEntries(entry=entry)},
    )()
    connection = _DummyConnection()
    msg = {"id": 2, "entry_id": "entry-1", "type": "maint/task/list"}

    assert _resolve_task_store(hass, connection, msg) is None
    assert connection.errors[0][1] == "entry_not_loaded"


def test_resolve_task_store_requires_runtime_data() -> None:
    """Entries missing Maint runtime data should send an error."""
    entry = type(
        "Entry",
        (),
        {
            "entry_id": "entry-1",
            "domain": DOMAIN,
            "state": ConfigEntryState.LOADED,
            "runtime_data": None,
        },
    )()
    hass = type(
        "Hass",
        (),
        {"config_entries": _DummyConfigEntries(entry=entry)},
    )()
    connection = _DummyConnection()
    msg = {"id": 3, "entry_id": "entry-1", "type": "maint/task/list"}

    assert _resolve_task_store(hass, connection, msg) is None
    assert connection.errors[0][1] == "runtime_data_missing"


def test_resolve_task_store_returns_store_when_loaded() -> None:
    """A valid entry should return the task store and entry."""
    runtime = MaintRuntimeData(task_store="store")  # type: ignore[arg-type]
    entry = type(
        "Entry",
        (),
        {
            "entry_id": "entry-1",
            "domain": DOMAIN,
            "state": ConfigEntryState.LOADED,
            "runtime_data": runtime,
        },
    )()
    hass = type(
        "Hass",
        (),
        {"config_entries": _DummyConfigEntries(entry=entry)},
    )()
    connection = _DummyConnection()
    msg = {"id": 4, "entry_id": "entry-1", "type": "maint/task/list"}

    store, resolved_entry = _resolve_task_store(hass, connection, msg)  # type: ignore[misc]

    assert store == "store"
    assert resolved_entry is entry
    assert connection.errors == []
