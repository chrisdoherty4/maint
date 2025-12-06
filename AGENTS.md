# Maint

## Overview

This repository is a Home Assistant integration built as a custom component. It is installed using
[HACS](https://www.hacs.xyz/). The integration is composed of a backend and frontend. It is used
for managing home maintenance tasks.

## Repository Layout

`/custom_components/maint` contains the integration backend written in Python.

`/tests` contains the backend tests.

`/frontend/src` contains the integrations frontend written in TypeScript.

`/frontend/tests` contains the frontend tests.

`/custom_components/maint/frontend` contains the compiled frontend sources - they are JavaScript and CSS.

`/custom_components/maint/translations` contains standard translations that satisfy Home Assistant
expectations (https://developers.home-assistant.io/docs/internationalization/core).

`/frontend/translations` contains the frontend specific translations that do not fit into the
standard translation specification. They are used by the frontend only.

`/brand` contains logo's and icons.

`/scripts` contains helper scripts - it should be used sparingly since we use Make.

`/config` contains Home Assistant configuration used for launching a local Home Assistant instance.

`/.github` contains GitHub actions workflows and other configuration.

## Development

### Environment

Development typically happens inside a devcontainer. While developing you may need additional
tooling. Ask to install additional tooling via the `.devcontainer.json`.

### Coding Philosophy

Prioritize clean code:

- Clarify over cleverness - make it easy for humans to read
- Single Responsibility Principal - units of code should have 1 reason to change
- Separation of Concerns - code should have a clean separation; e.g. business logic != persistence logic
- Testable - code is written so its easy to test

Code should follow a hexagonal architecture. Avoid packages/module names such as common, util and
const. Instead focus on colocating code based on the feature or capability it belongs to.

Do not implement any changes without sharing your proposal. This includes refactors, styling changes,
and new functionality. Include a summary where you explain the problem back to the user and provide
an overview of your proposed changes. Additionally include a details section with specifics on what
you plan to do.

### Testing & Linting

Write tests that focus on the public API of classes, modules and packages. Update existing tests
when refactoring and add new tests for new functionality. Run the tests with `make test` and fix
any issues they find.

Once you've finished making changes find and fix lint issues with `make lint`.

### Python

Use type hints for all variables, parameters and return values. Include adequete debug logging.

### TypeScript

Always use TypeScript and compile down to JavaScript. Assign real types to variables - i.e. avoid
the `unknown` type.

The TypeScript should be built with `make build-frontend` as an initial sanity check before testing.

## Translations

Translations should be used when implemented features that have user facing text. The translations
directories contain JSON files with country codes corresponding to the translation. When adding
translation strings ensure all translation files are updated.

To add a new translation create a new JSON file for both backend and frontend translations. Use
English as the source language to translate. Update the README to reflect the list of supported
languages.

## README.md

The README exists to market the integration to readers. It contains a list of features. Ensure the
features are updated when a new feature is added. The feature list should include a concise summary
of features and only reference what the user interacts with - do not include implementation detail.

The README is always in the present tense - do not use terminology like "Maint currently".

Maintain the optional configuration with all the options available for Maint and what they do.

## Temporary Constraints

Do not attempt to maintain backward compatibility. We have not released v1 so backward compatibility
is unnecessary.
