# ruff: noqa: S101
"""Tests for Maint services."""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

import pytest
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.util import dt as dt_util

from custom_components.maint import _async_get_task_store
from custom_components.maint.binary_sensor import MaintTaskBinarySensor
from custom_components.maint.domain import DOMAIN
from custom_components.maint.models import SIGNAL_TASK_UPDATED, MaintTask, Recurrence
from custom_components.maint.services import (
    DATA_KEY_SERVICES_REGISTERED,
    SERVICE_RESET_LAST_COMPLETED,
    _resolve_service_target,
    async_register_services,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .test_binary_sensor import FakeEntry as _FakeEntry
else:
    from unittest.mock import MagicMock

    from .test_binary_sensor import FakeEntry as _FakeEntry


def test_resolve_service_target_requires_entity(hass: HomeAssistant) -> None:
    """Entity-based targeting should raise when the entity is missing."""
    with pytest.raises(HomeAssistantError, match=r"Entity binary_sensor\.missing"):
        _resolve_service_target(
            hass,
            {
                "entity_id": "binary_sensor.missing",
            },
        )


def test_resolve_service_target_requires_task_metadata(hass: HomeAssistant) -> None:
    """Entity-based targeting should validate Maint-specific attributes."""
    hass.states.async_set("binary_sensor.unrelated", "on", {"wrong": "data"})

    with pytest.raises(HomeAssistantError, match="not a Maint task sensor"):
        _resolve_service_target(
            hass,
            {
                "entity_id": "binary_sensor.unrelated",
            },
        )


@pytest.mark.asyncio
async def test_reset_last_completed_defaults_to_today(
    monkeypatch: pytest.MonkeyPatch, hass: HomeAssistant
) -> None:
    """Service should update last_completed to today when not provided."""
    store = await _async_get_task_store(hass)
    async_register_services(hass, _async_get_task_store)
    task = await store.async_create_task(
        "entry-1",
        description="Flush water heater",
        last_completed=date(2024, 1, 1),
        recurrence=Recurrence(type="interval", every=45, unit="days"),
    )

    updates: list[date] = []

    def _record_update(_entry: str, updated_task: MaintTask) -> None:
        updates.append(updated_task.last_completed)

    unsubscribe = async_dispatcher_connect(hass, SIGNAL_TASK_UPDATED, _record_update)

    try:
        monkeypatch.setattr(
            "custom_components.maint.services.dt_util.now",
            lambda: datetime(2024, 5, 1, tzinfo=dt_util.UTC),
        )
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_LAST_COMPLETED,
            {"entry_id": "entry-1", "task_id": task.task_id},
            blocking=True,
        )
        await hass.async_block_till_done()
    finally:
        unsubscribe()

    updated = await store.async_get_task("entry-1", task.task_id)
    assert updated.last_completed == date(2024, 5, 1)
    assert updates == [date(2024, 5, 1)]


@pytest.mark.asyncio
async def test_reset_last_completed_accepts_explicit_date(
    hass: HomeAssistant,
) -> None:
    """Service should accept a provided date via entity target."""
    store = await _async_get_task_store(hass)
    async_register_services(hass, _async_get_task_store)
    entry_id = "entry-2"
    recurrence_days = 7
    task = await store.async_create_task(
        entry_id,
        description="Test task",
        last_completed=date(2024, 2, 1),
        recurrence=Recurrence(type="interval", every=recurrence_days, unit="days"),
    )
    entity_id = "binary_sensor.maint_test_task"
    hass.states.async_set(
        entity_id,
        "on",
        {
            "entry_id": entry_id,
            "task_id": task.task_id,
        },
    )

    await hass.services.async_call(
        DOMAIN,
        SERVICE_RESET_LAST_COMPLETED,
        {"entity_id": entity_id, "last_completed": date(2024, 6, 10)},
        blocking=True,
    )

    updated = await store.async_get_task(entry_id, task.task_id)
    assert updated.last_completed == date(2024, 6, 10)
    assert updated.recurrence.every == recurrence_days


@pytest.mark.asyncio
async def test_reset_last_completed_updates_binary_sensor(
    hass: HomeAssistant,
) -> None:
    """Service should push updates to binary sensor entities via dispatcher."""
    store = await _async_get_task_store(hass)
    async_register_services(hass, _async_get_task_store)
    entry_id = "entry-entity"
    task = await store.async_create_task(
        entry_id,
        description="Test task",
        last_completed=date(2024, 2, 1),
        recurrence=Recurrence(type="interval", every=30, unit="days"),
    )

    sensor = MaintTaskBinarySensor(entry=_FakeEntry(entry_id), task=task)
    sensor.hass = hass
    sensor.async_write_ha_state = MagicMock()

    # Mimic HA state for entity_id lookup in service target resolution.
    entity_id = "binary_sensor.maint_test_task"
    hass.states.async_set(
        entity_id,
        "on",
        {
            "entry_id": entry_id,
            "task_id": task.task_id,
        },
    )

    unsubscribe = async_dispatcher_connect(
        hass,
        SIGNAL_TASK_UPDATED,
        lambda _entry_id, updated_task: sensor.handle_task_update(updated_task),
    )

    try:
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_LAST_COMPLETED,
            {
                "entity_id": entity_id,
                "last_completed": date(2024, 7, 4),
            },
            blocking=True,
        )
        await hass.async_block_till_done()
    finally:
        unsubscribe()

    assert sensor.extra_state_attributes["last_completed"] == "2024-07-04"
    sensor.async_write_ha_state.assert_called()


@pytest.mark.asyncio
async def test_reset_last_completed_raises_for_unknown_task(
    hass: HomeAssistant,
) -> None:
    """Service should surface errors when the task cannot be located."""
    async_register_services(hass, _async_get_task_store)

    with pytest.raises(HomeAssistantError, match="Task missing-task not found"):
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_LAST_COMPLETED,
            {
                "entry_id": "entry-missing",
                "task_id": "missing-task",
            },
            blocking=True,
        )


def test_register_services_skips_when_already_registered(
    monkeypatch: pytest.MonkeyPatch, hass: HomeAssistant
) -> None:
    """async_register_services should not re-register after initial call."""
    hass.data.setdefault(DOMAIN, {})[DATA_KEY_SERVICES_REGISTERED] = True
    calls: list[tuple[tuple[object, ...], dict[str, object]]] = []

    async def _fake_register(*args: object, **kwargs: object) -> None:
        calls.append((args, kwargs))

    monkeypatch.setattr(type(hass.services), "async_register", _fake_register)

    async_register_services(hass, _async_get_task_store)

    assert calls == []
