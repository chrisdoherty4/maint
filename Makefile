PYTHON ?= python3
FRONTEND_DIR := frontend

.DEFAULT_GOAL := help

.PHONY: help setup deps deps-backend deps-frontend build-frontend lint lint-backend lint-frontend test test-backend test-frontend develop

# Show available targets and their descriptions.
help:
	@awk 'BEGIN {FS = ": *"} /^# [A-Za-z_.-]+/ {sub(/^# /, "", $$0); desc=$$0; next} /^[a-zA-Z0-9_.-]+:/{printf "%-18s %s\n", $$1, desc; desc=""}' $(MAKEFILE_LIST)

# Install backend and frontend dependencies.
setup: deps

# Install backend and frontend dependencies.
deps: deps-backend deps-frontend

# Install backend Python dependencies.
deps-backend:
	$(PYTHON) -m pip install -r requirements.txt

# Install frontend Node dependencies.
deps-frontend:
	cd $(FRONTEND_DIR) && npm ci

# Build all parts of the integration.
build: build-frontend

# Build the frontend bundle.
build-frontend: deps-frontend
	cd $(FRONTEND_DIR) && npm run build

# Run all linters.
lint: lint-backend lint-frontend

# Lint backend with Ruff.
lint-backend: deps-backend
	$(PYTHON) -m ruff format . --check
	$(PYTHON) -m ruff check .

# Lint frontend with ESLint.
lint-frontend: deps-frontend
	cd $(FRONTEND_DIR) && npm run lint

# Run backend and frontend tests.
test: test-backend test-frontend

# Run backend pytest with coverage and junit output.
test-backend: deps-backend
	$(PYTHON) -m pytest --cov=custom_components/maint --cov-report=xml --junitxml=junit.xml
	$(PYTHON) -m coverage report

# Run frontend vitest with coverage and junit output.
test-frontend: deps-frontend
	cd $(FRONTEND_DIR) && npm test -- --coverage

# Run Home Assistant locally for development.
launch: deps-backend build-frontend
	@set -e; \
	if [ ! -d "$(CURDIR)/config" ]; then \
		mkdir -p "$(CURDIR)/config"; \
		hass --config "$(CURDIR)/config" --script ensure_config; \
	fi; \
	PYTHONPATH="$$PYTHONPATH:$(CURDIR)/custom_components" hass --config "$(CURDIR)/config" --debug
