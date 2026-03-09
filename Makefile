.PHONY: all dev build test lint clean docker-up docker-down migrate seed

# ── Variables ─────────────────────────────────────────────────────────────────
BINARY=server
BACKEND_DIR=./backend
MOBILE_DIR=./mobile
DOCKER_COMPOSE=docker compose

# ── Development ───────────────────────────────────────────────────────────────
dev:
	@echo "Starting development environment..."
	$(DOCKER_COMPOSE) up db redis -d
	@sleep 2
	cd $(BACKEND_DIR) && air -c .air.toml

dev-mobile:
	cd $(MOBILE_DIR) && npx react-native start --reset-cache

# ── Build ─────────────────────────────────────────────────────────────────────
build:
	cd $(BACKEND_DIR) && \
	CGO_ENABLED=0 go build -ldflags="-w -s" -o bin/$(BINARY) ./cmd/server
	@echo "✅ Built: $(BACKEND_DIR)/bin/$(BINARY)"

build-android:
	cd $(MOBILE_DIR) && npx react-native build-android --mode=release

build-ios:
	cd $(MOBILE_DIR) && npx react-native build-ios --mode=Release

# ── Tests ─────────────────────────────────────────────────────────────────────
test:
	cd $(BACKEND_DIR) && go test ./... -race -coverprofile=coverage.out -covermode=atomic
	@echo "Coverage:"
	@cd $(BACKEND_DIR) && go tool cover -func=coverage.out | tail -1

test-mobile:
	cd $(MOBILE_DIR) && npx jest --coverage

# ── Lint ──────────────────────────────────────────────────────────────────────
lint:
	cd $(BACKEND_DIR) && golangci-lint run ./... --timeout=5m
	cd $(MOBILE_DIR) && npx eslint . --ext .ts,.tsx --max-warnings 0
	cd $(MOBILE_DIR) && npx tsc --noEmit

# ── Docker ────────────────────────────────────────────────────────────────────
docker-up:
	$(DOCKER_COMPOSE) up --build -d
	@echo "✅ All services running"
	@echo "API: http://localhost:8080"
	@echo "DB:  postgresql://localhost:5432/locus"

docker-down:
	$(DOCKER_COMPOSE) down

docker-logs:
	$(DOCKER_COMPOSE) logs -f api

docker-reset:
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up --build -d

# ── Database ──────────────────────────────────────────────────────────────────
migrate:
	cd $(BACKEND_DIR) && go run cmd/migrate/main.go up

migrate-down:
	cd $(BACKEND_DIR) && go run cmd/migrate/main.go down

seed:
	cd $(BACKEND_DIR) && go run cmd/seed/main.go

db-shell:
	$(DOCKER_COMPOSE) exec db psql -U locus -d locus

# ── Utils ─────────────────────────────────────────────────────────────────────
clean:
	cd $(BACKEND_DIR) && rm -rf bin/ coverage.out
	cd $(MOBILE_DIR) && rm -rf node_modules/.cache android/build ios/build

deps:
	cd $(BACKEND_DIR) && go mod tidy
	cd $(MOBILE_DIR) && npm install

setup: deps
	cp -n .env.example .env || true
	@echo "✅ Setup complete. Edit .env with your credentials."
	@echo "Then run: make docker-up"

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo "Locus — Available commands:"
	@echo "  make setup        — First-time project setup"
	@echo "  make dev          — Start backend in dev mode (with hot reload)"
	@echo "  make dev-mobile   — Start React Native Metro bundler"
	@echo "  make docker-up    — Start all services with Docker"
	@echo "  make docker-down  — Stop all services"
	@echo "  make test         — Run backend tests"
	@echo "  make lint         — Lint backend + frontend"
	@echo "  make migrate      — Run database migrations"
	@echo "  make build        — Build production binary"
