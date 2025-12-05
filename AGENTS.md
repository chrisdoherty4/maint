# Maint

## Overview

This repository is a Home Assistant integration built as a custom component. It is installed using [HACS](https://www.hacs.xyz/).
The integration is composed of a backend and frontend. It is used for managing home maintenance
tasks.

## Development Environment

- You run inside a devcontainer that should already have tools setup.
- If a tool you need isn't available, stop and ask what to do suggesting alternatives if you have any.

## Development

### General

- When you look to make changes, propose the changes first. Provide an summary followed by details including rationale.
- Prioritize readable, maintainable code. Keep changes aligned with module layout.
- Avoid packages/modules named common, utils, const etc. Instead, prefer placing constants an interfaces near the consumer where possible.
- Maintain separation of concerns between modules.
- Lint and test changes and fix issues.

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
- Use actual types (as opposed to `unknown`) whenever possible.

## Translations

- Backend Home Assistant standard keys for translations live in `custom_components/maint/translations/<lang>.json`.
- Frontend translations live in `custom_components/maint/frontend/translations/<lang>.json`. The frontend must be compiled for them to be usable.
- Use the English definition as the source of translations
- When adding new translation strings, ensure all translation files are updated.
- Ensure the README.md is updated to reflect the supported languages.

## README.md

- Add new features to the READMEs feature section. Feature details should be concerned with what the user interacts with only.
- The README always refers to the present tense so you should avoid phrasing such as "Maint currently".

## Temporary Constraints

- Do not attempt to maintain backward compatibility. We have not released yet so backwards compatibility is unnecessary.
