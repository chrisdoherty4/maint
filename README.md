# Maint

Maint is a Home Assistant custom component for tracking household maintenance tasks. It creates a
binary sensor for every task, keeps the schedule in sync through the UI and websocket API, and emits
events when tasks become due so you can automate reminders or actions.

## Features
- Per-task binary sensors that turn on when a task is due, with suggested object IDs for tidy naming.
- Persistent task storage with create/update/delete flows exposed via websocket commands.
- Frontend panel for managing tasks installed alongside the integration.
- Event `maint_task_due` fired when a task’s binary sensor turns on, including task metadata for use
  in automations.

## Install

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Chris+Doherty&repository=https%3A%2F%2Fgithub.com%2Fchrisdoherty4%2Fmaint&category=integration)

1) Install or update [HACS](https://hacs.xyz/) in your Home Assistant instance.
2) In HACS, open *Settings → Custom repositories* and add `https://github.com/chrisdoherty4/maint`
   as a *Integration* repository.
3) Find **Maint** under HACS Integrations and install it.
4) Restart Home Assistant, then add the Maint integration from *Settings → Devices & Services*.

## What's next
- Publish Maint to the HACS default registry so it can be installed without adding a custom
  repository.
