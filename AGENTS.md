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

## Development

- Review and update `README.md` for user-facing changes and refresh `custom_components/maint/quality_scale.yaml` when requirements are met.
- Lint and test changes - fix any issues.
- Consult https://developers.home-assistant.io/ for information on developing Home Assistant integrations.
- Prioritize readable, maintainable code. Keep changes aligned with module layout.
- Avoid packages/modules named common, utils, const etc. Instead, prefer placing constants an interfaces near the consumer where possible.

### Backend

- Provide type hints for all function parameters and returns.
- Code is linted using ruff; run `scripts/lint` (it formats then checks/fixes) after Python changes.
- Strings/translations: keep `custom_components/maint/strings.json` and `custom_components/maint/translations/en.json` in sync when copy changes.
- Include adequete debug logging.
- Testing: run `python -m pytest`; add/update tests in `/tests`, especially for new async HA flows.

### Frontend

- The frontend is written in TypeScript - always modify the TypeScript and compile down to JavaScript.
- Compile using the `./scripts/frontend`.

## Temporary Constraints

- Do not attempt to maintain backward compatibility. We have not released yet so backwards compatibility is unnecessary.
