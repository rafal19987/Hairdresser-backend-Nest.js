# Variables
APP_NAME := hairdresser-backend
DOCKER_COMPOSE := docker compose
NODE := node
NPM := npm

# Default target - display help
help:
	@echo "Available commands:"
	@echo "make run-db -  Run the database in container"

# Run database
run-db: db-up


# Start database
db-up:
	@echo "Starting database..."
	@$(DOCKER_COMPOSE) up -d mysql
	@echo "Database started"
	@echo "Waiting for database to be ready..."
	@counter=0; \
	while ! $(DOCKER_COMPOSE) exec -T mysql mysqladmin ping -h localhost --silent >/dev/null 2>&1 && [ $$counter -lt 30 ]; do \
		echo "Still waiting for database..."; \
		sleep 2; \
		counter=$$((counter + 1)); \
	done
	@if $(DOCKER_COMPOSE) exec -T mysql mysqladmin ping -h localhost --silent >/dev/null 2>&1; then \
		echo "Database is ready"; \
	else \
		echo "Warning: Database did not become ready within timeout"; \
	fi
