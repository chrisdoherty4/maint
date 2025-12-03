[![codecov](https://codecov.io/gh/chrisdoherty4/maint/graph/badge.svg?token=DV2TF78W8W)](https://codecov.io/gh/chrisdoherty4/maint)

# Maint

Maint is a Home Assistant custom component for tracking household maintenance tasks. It creates a
binary sensor for every task, keeps the schedule in sync through the UI and websocket API, and emits
events when tasks become due so you can automate reminders or actions.

## Languages

Maint ships translations for English, French, Spanish, German, and Dutch. If you see incorrect translations please raise a pull request.

## Features
- Built-in Maintenance panel installs alongside the integration so you can create, edit, delete, and
  mark tasks complete for any Maint entry.
- Per-task binary sensors with stable object IDs and helpful attributes (`entry_id`, `task_id`,
  `last_completed`, `next_scheduled`) for automations.
- A summary sensor per entry that counts due tasks and lists their binary sensors in `due_tasks`
  attributes.
- Optional calendar sync that mirrors each task to a chosen Home Assistant calendar (auto-creates a
  local calendar when missing).
- Recurring schedules: every N days/weeks/months or multi-day weekly patterns with every-N-week
  spacing.
- Tasks persist locally per entry and can be managed through websocket CRUD commands (used by the
  panel).
- Automation hooks: `maint_task_due` event fires when a task becomes due with task metadata, and the
  `maint.reset_last_completed` service marks tasks complete (optionally backdated, default today).

## Install

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Chris+Doherty&repository=https%3A%2F%2Fgithub.com%2Fchrisdoherty4%2Fmaint&category=integration)

1) Install or update [HACS](https://hacs.xyz/) in your Home Assistant instance.
2) In HACS, open *Settings → Custom repositories* and add `https://github.com/chrisdoherty4/maint`
   as a *Integration* repository.
3) Find **Maint** under HACS Integrations and install it.
4) Restart Home Assistant, then add the Maint integration from *Settings → Devices & Services*.

## Usage

1) Open the **Maintenance** sidebar item that Maint adds. Pick the Maint entry to manage if you have
   more than one configured.
2) Create tasks from the form at the top of the panel. Give the task a description, set the date it
   was last completed (used as the starting point), and pick a schedule:
   - **Every N**: choose a number of days, weeks, or months between occurrences.
   - **Days of the week**: pick one or more weekdays and how many weeks apart to repeat them.
3) Manage tasks from the list:
   - *Mark complete* updates the task’s `last_completed` date to today so the next due date advances.
   - *Edit* lets you change the description, schedule, or last completed date.
   - *Delete* removes the task and its entities.
4) Use the entities that are created for each task:
   - A binary sensor turns on when the task is due; it also fires the `maint_task_due` event on
     activation with task metadata.
   - A summary sensor reports how many tasks are currently due and links to their binary sensors.
5) Automate reminders or actions with the binary sensors or `maint_task_due` event. You can also use
   the `maint.reset_last_completed` service in automations to mark tasks complete programmatically.

## Service

Call the `maint.reset_last_completed` service to mark a task complete. Target a Maint binary sensor
entity or pass `entry_id` and `task_id`, and optionally include `last_completed` to backdate the
completion (defaults to today).

Example targeting the Maint binary sensor created for a task:

```yaml
service: maint.reset_last_completed
target:
  entity_id: binary_sensor.maint_kitchen_filter
data:
  last_completed: "2024-07-15"
```

Example targeting the task directly when you have its `entry_id` and `task_id` (no entity needed):

```yaml
service: maint.reset_last_completed
data:
  entry_id: f6e5d4c3b2a1
  task_id: 1234567890ab
  last_completed: "2024-07-15"
```

## Dashboard card examples

Use these Lovelace snippets to list Maint tasks and quickly mark them complete. Replace the entity
IDs with your own (e.g., `binary_sensor.maint_hvac_filter`) and adjust card titles as needed.

### Simple built-in cards

- Entities card with quick actions:

```yaml
type: entities
title: Maintenance tasks
entities:
  - entity: sensor.maint_tasks_due
    name: Tasks due
  - type: section
    label: Kitchen filter
  - entity: binary_sensor.maint_kitchen_filter
    name: Kitchen filter due
  - type: button
    name: Mark kitchen filter complete
    icon: mdi:check
    action_name: Complete
    tap_action:
      action: call-service
      service: maint.reset_last_completed
      target:
        entity_id: binary_sensor.maint_kitchen_filter
```

- Tile grid to quickly mark a couple of tasks complete:

```yaml
type: grid
title: Quick completes
columns: 2
square: false
cards:
  - type: tile
    entity: binary_sensor.maint_kitchen_filter
    name: Kitchen filter
    tap_action:
      action: call-service
      service: maint.reset_last_completed
      target:
        entity_id: binary_sensor.maint_kitchen_filter
  - type: tile
    entity: binary_sensor.maint_smoke_detectors
    name: Smoke detectors
    tap_action:
      action: call-service
      service: maint.reset_last_completed
      target:
        entity_id: binary_sensor.maint_smoke_detectors
```

### Advanced custom cards

- Auto-generated list of due tasks using [`custom:auto-entities`](https://github.com/thomasloven/lovelace-auto-entities),
  rendered as buttons with service calls:

```yaml
type: custom:auto-entities
card:
  type: grid
  columns: 2
  square: false
card_param: cards
filter:
  include:
    - domain: binary_sensor
      entity_id: binary_sensor.maint_*
      state: "on"
      options:
        type: button
        entity: this.entity_id
        icon: mdi:check-circle
        show_state: true
        tap_action:
          action: call-service
          service: maint.reset_last_completed
          service_data:
            entity_id: this.entity_id
```

- A styled tile list using [`custom:button-card`](https://github.com/custom-cards/button-card) to
  show next due date and provide a completion tap:

```yaml
type: grid
title: Maintenance tasks
square: false
columns: 1
cards:
  - type: custom:button-card
    entity: binary_sensor.maint_water_heater_flush
    name: Water heater flush
    show_state: true
    show_icon: true
    state_display: >
      [[[
        const due = entity.attributes.next_scheduled || "Unknown";
        return entity.state === "on" ? `Due • ${due}` : `Not due • ${due}`;
      ]]]
    tap_action:
      action: call-service
      service: maint.reset_last_completed
      service_data:
        entity_id: binary_sensor.maint_water_heater_flush
    styles:
      card:
        - padding: 12px
      state:
        - font-size: 12px
        - color: var(--secondary-text-color)
      name:
        - font-weight: bold
```

## What's next

- Publish Maint to the HACS default registry so it can be installed without adding a custom
  repository.
- Integrate with Todo lists.
- Integrate with Calendar.
- Support multiple languages.
- Use locale for date rendering.
