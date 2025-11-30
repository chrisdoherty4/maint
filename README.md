# Maint

Maint is a Home Assistant custom component for tracking household maintenance tasks. It creates a
binary sensor for every task, keeps the schedule in sync through the UI and websocket API, and emits
events when tasks become due so you can automate reminders or actions.

## Features
- Per-task binary sensors that turn on when a task is due, with suggested object IDs for tidy naming.
- A summary sensor that reports how many tasks are due and includes the binary sensors tied to each.
- Persistent task storage with create/update/delete flows exposed via websocket commands.
- Frontend panel for managing tasks installed alongside the integration.
- Flexible schedules: intervals (every N days/weeks/months) and custom weekly patterns with selectable
  days and every-N-week spacing.
- Event `maint_task_due` fired when a task’s binary sensor turns on, including task metadata for use
  in automations.
- Service `maint.reset_last_completed` to mark a task as completed (defaults to today, or provide a
  specific date).

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

## What's next

- Publish Maint to the HACS default registry so it can be installed without adding a custom
  repository.
- Integrate with Todo lists.
- Integrate with Calendar.
- Support multiple languages.
- Use locale for date rendering.
