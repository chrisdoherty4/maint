# ruff: noqa: S101
"""Tests for Maint websocket utility helpers."""

from __future__ import annotations

import pytest
import voluptuous as vol

from custom_components.maint.websocket import (
    _convert_frequency_to_days,
    _validated_description,
)


@pytest.mark.parametrize(
    ("frequency", "unit", "expected"),
    [
        (5, "days", 5),
        (2, "weeks", 14),
        (1, "months", 30),
    ],
)
def test_convert_frequency_to_days(frequency: int, unit: str, expected: int) -> None:
    """Frequencies should normalize to days."""
    assert _convert_frequency_to_days(frequency, unit) == expected


def test_validated_description_trims_and_accepts_text() -> None:
    """Whitespace should be stripped and non-empty results accepted."""
    assert _validated_description("  Hello  ") == "Hello"


def test_validated_description_rejects_empty() -> None:
    """Empty or whitespace-only descriptions should raise."""
    with pytest.raises(vol.Invalid):
        _validated_description("   ")
