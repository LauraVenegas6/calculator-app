# syntax=docker/dockerfile:1

# ---- Stage 1: build the frontend (Vite) ----
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: build the backend (Go) ----
FROM golang:1.27-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum* ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# ---- Stage 3: final runtime image ----
FROM alpine:3.20
WORKDIR /app

COPY --from=backend-builder /app/backend/server .
COPY --from=frontend-builder /app/frontend/dist ./static

EXPOSE 8080
CMD ["./server"]