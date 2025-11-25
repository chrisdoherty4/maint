# Maint

## Overview

This is a home assistant integration built as a custom component. It is installed using [HACS](https://www.hacs.xyz/).
The integration is composed of a backend and frontend. It is used for managing home maintenance
tasks.

## Development Environment

- You run inside a devcontainer that should already have tools setup.
- If you find a tool you need isn't available, install it and notify the user.

## Development Workflow

- Code is linted using ruff.
- `scripts/lint` can be used to lint with ruff.
- When Python or JavaScript files are changed always lint them and fix problems.
- Include adequete debug and info logs.
- Review and update the README.md with user facing features.
