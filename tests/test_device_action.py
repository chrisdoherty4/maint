# ruff: noqa: S101
"""Tests for Maint device actions."""

from __future__ import annotations

from datetime import date, datetime
from types import MappingProxyType, SimpleNamespace
from typing import TYPE_CHECKING

import pytest
from homeassistant.config_entries import SOURCE_USER, ConfigEntry, ConfigEntryState
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from custom_components.maint import device_action
from custom_components.maint.const import DOMAIN
from custom_components.maint.models import MaintRuntimeData, MaintTaskStore

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


def _create_entry(store: MaintTaskStore) -> ConfigEntry:
    entry = ConfigEntry(
        data={},
        domain=DOMAIN,
        version=1,
        minor_version=1,
        entry_id="entry-1",
        source=SOURCE_USER,
        title="Maint",
        discovery_keys=MappingProxyType({}),
        options={},
        unique_id=DOMAIN,
        state=ConfigEntryState.LOADED,
        subentries_data=None,
    )
    entry.runtime_data = MaintRuntimeData(task_store=store)
    return entry


@pytest.mark.asyncio
async def test_get_actions_only_lists_task_binary_sensors(
    hass: HomeAssistant,
) -> None:
    """Only Maint task binary sensors expose the mark_complete action."""
    store = MaintTaskStore(hass)
    await store.async_load()
    entry = _create_entry(store)
    hass.config_entries = SimpleNamespace(
        async_get_entry=lambda entry_id: entry if entry_id == entry.entry_id else None
    )

    device_registry = dr.async_get(hass)
    device = device_registry.async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, entry.entry_id)},
    )
    entity_registry = er.async_get(hass)
    task_entity = entity_registry.async_get_or_create(
        "binary_sensor",
        DOMAIN,
        f"{entry.entry_id}_task-1",
        config_entry=entry,
        device_id=device.id,
    )
    entity_registry.async_get_or_create(
        "sensor",
        DOMAIN,
        f"{entry.entry_id}_summary",
        config_entry=entry,
        device_id=device.id,
    )

    actions = await device_action.async_get_actions(hass, device.id)

    assert actions == [
        {
            "device_id": device.id,
            "domain": DOMAIN,
            "entity_id": task_entity.id,
            "type": device_action.ACTION_TYPE_MARK_COMPLETE,
        }
    ]


@pytest.mark.asyncio
async def test_call_action_marks_task_complete(
    hass: HomeAssistant, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Executing the mark_complete action updates last_completed."""
    store = MaintTaskStore(hass)
    await store.async_load()
    entry = _create_entry(store)
    hass.config_entries = SimpleNamespace(
        async_get_entry=lambda entry_id: entry if entry_id == entry.entry_id else None
    )
    device_registry = dr.async_get(hass)
    device = device_registry.async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, entry.entry_id)},
    )

    task = await store.async_create_task(
        entry.entry_id,
        description="Replace filter",
        last_completed=date(2024, 1, 1),
        frequency=7,
    )
    entity_registry = er.async_get(hass)
    task_entity = entity_registry.async_get_or_create(
        "binary_sensor",
        DOMAIN,
        f"{entry.entry_id}_{task.task_id}",
        config_entry=entry,
        device_id=device.id,
    )

    monkeypatch.setattr(
        "custom_components.maint.device_action.dt_util.now",
        lambda: datetime(2024, 4, 1, tzinfo=dt_util.UTC),
    )

    await device_action.async_call_action_from_config(
        hass,
        {
            "device_id": device.id,
            "domain": DOMAIN,
            "entity_id": task_entity.id,
            "type": device_action.ACTION_TYPE_MARK_COMPLETE,
        },
        {},
        None,
    )

    updated = await store.async_get_task(entry.entry_id, task.task_id)
    assert updated.last_completed == date(2024, 4, 1)
