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

### General

- Lint and test changes - fix any issues.
- Consult https://developers.home-assistant.io/ for information on developing Home Assistant integrations.
- Prioritize readable, maintainable code. Keep changes aligned with module layout.
- Avoid packages/modules named common, utils, const etc. Instead, prefer placing constants an interfaces near the consumer where possible.
- Maintain a good separation of concerns by reviewing existing code and partitioning into modules as needed.
- If a refactor of modules is identified, propose it before implementing.

### Backend

- Provide type hints for all function parameters and returns.
- Code is linted using ruff; run `scripts/lint` (it formats then checks/fixes) after Python changes.
- Include adequete debug logging.
- Testing
    - Tests are defined in `/tests`
    - Run tests with `python3 -m pytest --cov=custom_components/maint --cov-report=xml --junitxml=junit.xml`
    - Focus on the public API of modules. For example functions prefixed with _ should be considered private.
    - When new tests are working, use the coverage report to identify areas that could use improvement; 80% coverage is preferred but not required.
    - If a redesign is needed for better testability/cleaner code, propose them before making the refactor


### Frontend

- The frontend is written in TypeScript - always modify the TypeScript and compile down to JavaScript.
- Compile using the `./scripts/frontend`.
- Avoid using the `unknown` type whenever possible.

## Translations

- Backend Home Assistant standard keys for translations live in `custom_components/maint/translations/<lang>.json` (title/config/options/services).   Add/edit translations in both `*.json`. Use the same key shape across languages.
- UI strings live in `custom_components/maint/frontend/translations/<lang>.json` and are flattened at build time via `src/translations.ts` into `component.maint.panel.*` and `component.maint.recurrence.*` keys. Add/edit translations in both `*.json`, then re-run `./scripts/frontend`. Use the same key shape across languages.
- Use the English definition as the source of translation.

## README.md

- Review and update the README with new features.
- Ensure the README reflects all supported languages.
- Avoid terminology like "Maint currently"; the README always refers to the present tense.
- When describing features and languages, avoid implementation details and focus on what the user sees and interacts with.

## Temporary Constraints

- Do not attempt to maintain backward compatibility. We have not released yet so backwards compatibility is unnecessary.
