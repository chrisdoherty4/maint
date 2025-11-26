# Maint

## Overview

This is a home assistant integration built as a custom component. It is installed using [HACS](https://www.hacs.xyz/).
The integration is composed of a backend and frontend. It is used for managing home maintenance
tasks.

## Development Environment

- You run inside a devcontainer that should already have tools setup.
- If you find a tool you need isn't available, install it and notify the user.

## Setup

- Use `scripts/develop` to start Home Assistant locally; it creates `config/`, sets `PYTHONPATH` so `custom_components/maint` is found, and boots HA for manual testing.

## Development Workflow

- Code is linted using ruff; run `scripts/lint` (it formats then checks/fixes) after Python changes.
- There is no JS build/lint pipeline; keep `custom_components/maint/frontend/maint-panel.js` as a plain ES module.
- When Python or JavaScript files are changed always lint them and fix problems.
- Testing: run `python -m pytest`; add/update tests in `/tests`, especially for new async HA flows.
- Strings/translations: keep `custom_components/maint/strings.json` and `custom_components/maint/translations/en.json` in sync when copy changes.
- Storage changes (`MaintTaskStore`): maintain `STORAGE_VERSION`, do not add migration logic - just change the existing code, and cover with tests.
- Review and update `README.md` for user-facing changes and refresh `custom_components/maint/quality_scale.yaml` when requirements are met.
- Include adequate debug/info logs and honor configurable log levels (`info`/`debug`).
