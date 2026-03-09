# ── Stage 1: Build (multi-arch: amd64 + arm64 for Oracle Always Free Ampere) ───
FROM golang:1.21-alpine AS builder
# golang:alpine and alpine are multi-arch; no native deps, so arm64 is safe.

ARG TARGETARCH
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH:-amd64} \
    go build -ldflags="-w -s -X main.version=$(git describe --tags --always 2>/dev/null || echo dev)" \
    -o /app/bin/server ./cmd/server

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata curl && \
    addgroup -S locus && adduser -S locus -G locus

WORKDIR /app

COPY --from=builder /app/bin/server ./server

USER locus

EXPOSE 8080
# Server must bind to 0.0.0.0 inside container (set BIND_ADDRESS=0.0.0.0) so the host and iOS Simulator can reach it on port 8080.

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["./server"]
