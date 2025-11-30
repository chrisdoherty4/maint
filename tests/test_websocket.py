# ruff: noqa: S101
"""Tests for Maint websocket utility helpers."""

from __future__ import annotations

import pytest
import voluptuous as vol

from custom_components.maint.websocket import (
    _parse_recurrence,
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
