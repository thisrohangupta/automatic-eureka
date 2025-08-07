# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app

# Cache deps first
COPY go.mod .
RUN go mod download

# Copy source
COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./main.go

# Runtime stage
FROM alpine:3.20
WORKDIR /app

# Non-root user
RUN adduser -D -H appuser

COPY --from=builder /app/server /app/server
COPY static ./static
COPY templates ./templates
# Copy existing data if present (optional)
# COPY todos.json ./todos.json

ENV PORT=5000
EXPOSE 5000

USER appuser

CMD ["/app/server"]
