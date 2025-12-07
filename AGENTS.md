# Maint

## Overview

This repository is a Home Assistant integration built as a custom component. It's installed using
[HACS](https://www.hacs.xyz/). The integration is composed of a backend and frontend. It is used
for managing recurring home maintenance tasks.

## Repository Layout

- `/custom_components/maint`: integration backend written in Python
  - `/frontend`: compiled frontend sources - JavaScript and CSS
  - `/translations`: standard translations that satisfy Home Assistant expectations
    (https://developers.home-assistant.io/docs/internationalization/core)
- `/tests`: backend tests
- `/frontend`: frontend configuration like npm configs etc
  - `/src`: the integrations frontend written in TypeScript
  - `/less`: LeSS stylesheets for the maint panel
  - `/tests`: frontend tests
  - `/translations`: frontend specific translations that do not fit into the
    standard translation specification; they are used by the frontend only
- `/brand`: logo's and icons
- `/scripts`: helper scripts - it should be used sparingly since we use Make
- `/config`: Home Assistant configuration used for launching a local Home Assistant instance
- `/.github`: GitHub configuration

## Development

### Environment

Development happens inside a devcontainer. If you need additional tooling, ask the user if you can
modify the `/.devcontainer.json` to add the feature.

### Coding Philosophy

Prioritize clean code:

- Clarify over cleverness - make it easy for humans to read
- Single Responsibility Principal - units of code should have 1 reason to change
- Separation of Concerns - code should have a clean separation; e.g. business logic separate from
  persistence logic
- Testable - code is written so its easy to test

Code should follow a hexagonal architecture. Avoid packages/module names like common, util and
const. Focus on colocating code in the same module based on the feature or capability it relates to.

Before making changes, make a proposal of what you plan to change.

### Testing & Linting

Write tests that focus on the public API of classes, modules, and packages. When refactoring update
existing tests. Add new tests for new code.

Test commands:

- `make test`: run both backend and frontend tests
- `make test-frontend`: run frontend tests only
- `make test-backend`: run backend tests only

After making changes run the relevant tests for the code that has changed. Fix all test issues.

Lint commands:

- `make lint`: lint both frontend and backend
- `make lint-frontend`: lint the frontend only
- `make lint-frontend-less`: lint the LeSS only
- `make lint-backend`: lint the backend only

After making changes run the relevant linters for the code that has changed. Fix all lint issues.

### Python

Use type hints for all variables, parameters and return values. Include adequete debug logging.

### TypeScript

Always use TypeScript for the frontend, it will be compiled down to JavaScript. Assign real types to
variables - i.e. avoid the `unknown` type.

### LeSS/CSS

We write frontend styles in LeSS. It is compiled into CSS using the `make build-frontend-less`.
When making CSS only changes do not run tests or build the frontend.

## Translations

All user facing text should have translations. Translation files are named with the country code they
correspond to. When adding translation strings ensure all translation files are updated.

To add a new language create a new JSON file for both backend and frontend translations. Use
English as the source language to translate. Update the README to reflect the list of supported
languages.

## README.md

The README is always in the present tense - do not use terminology like "Maint currently".

The README exists to market the integration to readers. When adding a new feature update the feature
list with a concise summary. Only include details of user facing functionality - avoid implementation
detail.

Update the optional configuration notes with concicse summary of optional settings.

## Temporary Constraints

Do not attempt to maintain backward compatibility. We have not released v1 so backward compatibility
is unnecessary.
