
# Calculator App

A full-stack calculator application built as a technical assessment project. It exposes basic and scientific arithmetic operations through a REST API implemented in Go, consumed by a React + TypeScript frontend styled as a physical/mobile calculator keypad.  
- Laura Alejandra Venegas Piraban

## 1. Project Overview

This project implements a calculator where all arithmetic logic lives on the backend, and the frontend is a thin client responsible only for user interaction and presentation.

**Technologies used:**
- Frontend: React + TypeScript (built with Vite)
- Backend: Go (standard library `net/http`, no web framework)
- Communication: REST API over JSON
- Containerization: Docker (single multi-stage build)

**Operations supported:**
- Addition
- Subtraction
- Multiplication
- Division
- Exponentiation
- Square Root
- Percentage

There is no database and no authentication — this is intentional, as detailed in [Design Decisions](#14-design-decisions).

## 2. Features

**Implemented:**
- REST endpoint to perform calculations (`POST /api/calculate`)
- Support for all 7 operations listed above
- Physical-calculator-style keypad UI (digit entry, chained operations, decimal point, backspace, clear)
- Chaining of multiple operations in sequence (e.g. `5 + 3 + 2 =`), implemented on the frontend by resolving each binary step against the backend as it's entered
- Frontend-side format validation (empty input, non-numeric input) before calling the API
- Backend-side business validation (division by zero, square root of a negative number, unknown operation, missing operand)
- Consistent JSON error responses from the backend
- CORS support for local development (frontend and backend running on different ports)
- Unit tests for the backend calculator service
- Unit tests for frontend components/hooks
- Single Docker image that builds and serves both frontend and backend

**Not implemented:**
- No persistence or database
- No authentication or authorization
- No calculation history
- No CI/CD pipeline

## 3. Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI library |
| TypeScript | Static typing for frontend code |
| Vite | Frontend build tool and dev server |
| Go (standard library `net/http`) | Backend REST API server |
| Docker | Packaging frontend and backend into a single runnable image |

## 4. Architecture

The application follows a simple layered flow:

**Frontend responsibility:** capture user input via a keypad interface, perform lightweight format validation (is there a value, is it a finite number), call the REST API, and render the result, error, or loading state. It contains no arithmetic logic.

**Backend responsibility:** owns all calculation logic and business validation. It is the single source of truth for what a valid operation is and how it is computed.

**Layers inside the backend:**
- **`handlers`** — translates between HTTP and the domain. Decodes JSON, checks structural validity (e.g. missing `operation` field), calls the service, and maps results/errors to HTTP status codes and JSON responses. Contains no math.
- **`services`** — contains the actual arithmetic and business rules (e.g. rejecting division by zero). Has no knowledge of HTTP; it operates on plain Go types and returns typed errors.
- **`model`** — defines the request/response/error data structures (`CalculationRequest`, `CalculationResponse`, `ErrorResponse`, `Operation`). Contains no behavior beyond basic data definitions.

## 5. Project Structure
calculator-app/
├── Dockerfile
├── .dockerignore
├── .gitignore
├── backend/
│ ├── go.mod
│ ├── main.go
│ ├── model/
│ │ └── calculator.go
│ ├── services/
│ │ ├── calculator.go
│ │ └── calculator_test.go
│ └── handlers/
│ ├── calculator.go
│ └── calculator_test.go
└── frontend/
├── package.json
├── package-lock.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tsconfig.app.json
└── src/
├── App.tsx
├── App.css
├── types/
│ └── calculator.ts
├── api/
│ └── calculatorApi.ts
├── hooks/
│ ├── useCalculatorKeypad.ts
│ └── useCalculatorKeypad.test.ts
├── components/
│ ├── Calculator.tsx
│ ├── Calculator.test.tsx
│ ├── Display.tsx
│ ├── Keypad.tsx
│ └── ErrorMessage.tsx
└── test/
└── setup.ts  

**Notable files:**
- `backend/main.go` — wires the HTTP routes and, in the Docker image, serves the built frontend as static files alongside the API.
- `backend/services/calculator.go` — the only place where calculations are performed.
- `frontend/src/hooks/useCalculatorKeypad.ts` — manages all keypad state (current display, pending operation, accumulator, loading, error) and orchestrates calls to the API.
- `frontend/src/api/calculatorApi.ts` — the single module responsible for communicating with the backend.

## 6. Prerequisites

To run the project locally (outside Docker), you need:

- **Go** — version compatible with the one declared in `backend/go.mod` (`go 1.27.1`). Run `go version` to confirm your local installation matches or exceeds this.
- **Node.js and npm** — required to install and run the frontend. Exact required version is defined by whatever is in `frontend/package.json`'s `engines` field, if present; otherwise, a current LTS Node version is expected to work with Vite.
- **Docker** — only required if running via the container (see [Docker](#9-docker)).

> Note: the exact Node.js version constraint could not be confirmed without inspecting `frontend/package.json` in full; verify it directly if reproducibility across environments matters.

## 7. Installation

### Backend

```bash
cd backend
go mod download
```

### Frontend

```bash
cd frontend
npm install
```

## 8. Running Locally

### Backend

From the `backend/` directory:

```bash
go run main.go
```

The API server starts on port **8080** (`http://localhost:8080`).

### Frontend

From the `frontend/` directory:

```bash
npm run dev
```

The Vite dev server starts on port **5173** (`http://localhost:5173`) by default.

> When running frontend and backend separately in development, the backend includes a CORS middleware allowing requests from `http://localhost:5173`. If the frontend dev server runs on a different port, that origin must be updated in `backend/main.go`.

## 9. Docker

The project includes a single `Dockerfile` at the repository root that builds and runs **both** frontend and backend in one container, using a multi-stage build:

1. **Stage 1 (`frontend-builder`)** — uses a Node image to install frontend dependencies and run `npm run build`, producing static assets in `frontend/dist`.
2. **Stage 2 (`backend-builder`)** — uses a Go image to compile the backend into a single static binary.
3. **Final stage** — a minimal Alpine image containing only the compiled Go binary and the built frontend static files. The Go binary serves the API at `/api/calculate` and serves the frontend static files for all other routes.

**Why a single container:** running two long-lived processes (a Node dev server and a Go server) inside one container would require an additional process manager and would keep a development-only server in a production image. Instead, the frontend is compiled to static files ahead of time and served directly by the Go binary, keeping the container to a single process.

### Build the image

From the repository root (where `Dockerfile` is located):

```bash
docker build -t calculator-app .
```

### Run the container

```bash
docker run -p 8080:8080 calculator-app
```

### Access the application

Open `http://localhost:8080` in a browser. The frontend is served from this same origin, and it calls `/api/calculate` on the same origin as well — no CORS configuration is needed in this mode.

No `docker-compose.yml` exists in this project; a single `docker run` command is sufficient since there is only one container.

## 10. API Documentation

The only endpoint is:

### `POST /api/calculate`

Performs a calculation.

**Request body (JSON):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `operation` | string | Yes | One of: `addition`, `subtraction`, `multiplication`, `division`, `exponentiation`, `square_root`, `percentage` |
| `a` | number | Yes | First operand |
| `b` | number | Conditional | Required for all operations except `square_root` |

**Success response — `200 OK`:**
```json
{
  "result": 5
}
```

**Error response — `400 Bad Request`:**
```json
{
  "error": "division by zero"
}
```

**Relevant status codes:**
| Status | Meaning |
|---|---|
| 200 | Calculation succeeded |
| 400 | Malformed JSON, missing `operation` field, or a known business error (division by zero, negative square root, missing operand, unknown operation) |
| 405 | HTTP method other than `POST` used |
| 500 | Unexpected internal error (not expected in normal operation, since all known service errors are mapped to 400) |

## 11. API Examples

**Addition:**
```bash
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"addition","a":2,"b":3}'
```
Response:
```json
{"result":5}
```

**Square root (unary operation, no `b` field):**
```bash
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"square_root","a":9}'
```
Response:
```json
{"result":3}
```

**Division by zero:**
```bash
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"division","a":10,"b":0}'
```
Response (`400 Bad Request`):
```json
{"error":"division by zero"}
```

**Unknown operation:**
```bash
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"modulo","a":5,"b":2}'
```
Response (`400 Bad Request`):
```json
{"error":"unknown operation"}
```

## 12. Validation and Error Handling

Validation is split into two levels, matching the layered architecture:

**Frontend (format-level, in `useCalculatorKeypad.ts`):**
- Rejects empty operand values before calling the API.
- Rejects non-finite numeric values (`NaN`, `Infinity`).
- Determines which operations require a second operand (all except `square_root`) and adjusts the UI/request accordingly.
- Does **not** duplicate backend business rules (e.g. it does not pre-check for division by zero).

**Backend (business-level, in `services/calculator.go`):**
- `division` by zero returns a `ErrDivisionByZero` error.
- `square_root` of a negative number returns a `ErrNegativeSqrt` error.
- An unrecognized `operation` value returns a `ErrUnknownOperation` error.
- A missing required operand `b` (for binary operations) returns a `ErrMissingOperand` error.

**Error propagation:**
- The service layer returns Go sentinel errors, with no knowledge of HTTP.
- The handler layer (`handlers/calculator.go`) uses `errors.Is` to map each known service error to `400 Bad Request`, and defaults to `500 Internal Server Error` for anything unrecognized.
- All error responses share the same JSON shape: `{"error": "<message>"}`.
- The frontend displays the exact error message returned by the backend; it does not rewrite or reinterpret backend error text.
- Network failures (backend unreachable) are handled separately in the frontend and shown as a generic connectivity message, distinct from backend-returned errors.

## 13. Testing

### Backend

From the `backend/` directory:

```bash
go test ./... -v
```

This runs the table-driven unit tests in `services/calculator_test.go`, covering:
- Happy paths for all 7 operations
- Zero values
- Negative numbers
- Decimal numbers
- Division by zero
- Square root of a negative number
- Unknown operations
- Missing required operand

Handler-level tests exist in `handlers/calculator_test.go`.

### Frontend

From the `frontend/` directory:

```bash
npm test
```

Test files present in the project include `Calculator.test.tsx` and `useCalculatorKeypad.test.ts`, using a Vitest configuration (`vitest.config.ts`) and a test setup file (`src/test/setup.ts`).

> The exact assertions and testing libraries used inside these test files (e.g. React Testing Library) were not verified against final file contents for this document; refer to the test files directly for their current coverage.

**Coverage reports:** no coverage command or configuration was confirmed in this project. If `vitest.config.ts` enables coverage, it can typically be run with a `--coverage` flag, but this was not verified here and no coverage percentage is claimed.

## 14. Design Decisions

| Decision | Reason |
|---|---|
| React + TypeScript | Type safety on the frontend, catching mismatches with the API contract at compile time. |
| Go with standard library `net/http` (no framework) | The API surface is a single endpoint; a framework like Gin or Echo would add a dependency without solving a real problem here. |
| REST over JSON | Simple, well-understood contract; no requirement for more complex protocols. |
| Separation into handlers / services / model | Keeps HTTP concerns, business logic, and data shapes independently testable and easy to reason about. |
| Business validation in the service layer, format validation in handlers/frontend | Rules that depend on the meaning of an operation (e.g. division by zero) belong with the operation itself; rules about request shape belong with the transport layer. |
| No database | The calculator has no state to persist between requests; adding one would be unused complexity. |
| No authentication | Out of scope for this assessment; the API has no user-specific data to protect. |
| Single Docker image serving both frontend and backend | Avoids running two long-lived processes in one container and avoids adding a process manager; the compiled frontend is static and can be served directly by the Go binary. |
| Chained operations resolved via sequential API calls (frontend) | Mirrors how a physical calculator works (each operator resolves the pending calculation), and avoids changing the backend's two-operand contract, which is already implemented and tested. |
| Sentinel errors in the service layer | Allow the handler layer to distinguish error types with `errors.Is` instead of comparing error strings. |

## 15. AI Usage

AI assistance (Claude) was used throughout the development of this project for:
- Analyzing requirements and proposing an initial architecture
- Exploring the separation of responsibilities between frontend, backend, handlers, services, and models
- Generating initial code for models, services, handlers, and frontend components/hooks
- Generating unit tests and a test case matrix for the calculator service
- Identifying edge cases (division by zero, negative square root, missing operands, non-finite input)
- Reviewing and debugging issues (module path mismatches, CORS configuration, Go version mismatches in Docker)
- Drafting project documentation, including this README

All AI-generated code was reviewed, executed, and validated locally (including running unit tests and manual API/UI testing) before being accepted. Final architectural and implementation decisions were made by the developer.

### Prompts used

- Architecture proposal for a full-stack calculator (frontend/backend responsibilities, request flow, validation strategy, error handling)
- Generation of Go model structs for calculator requests/responses
- Generation of an HTTP-independent calculator service supporting seven operations
- Generation of a test case matrix and corresponding unit tests for the calculator service
- Generation of an HTTP handler connecting the service to a REST endpoint
- Design and implementation of a React + TypeScript keypad-style calculator UI
- Debugging assistance for Go module import paths, CORS issues, and Docker build failures related to Go version mismatches
- Generation of a multi-stage Dockerfile to run frontend and backend in a single container
- Generation of this README

## 16. Assumptions and Limitations

- The application assumes each calculation request is independent; no operation history is stored between requests.
- There is no persistence layer; nothing is saved after the server restarts.
- There is no authentication or authorization; the API is open to any client that can reach it.
- The scope is limited to the seven listed calculator operations; no other math functions are supported.
- `percentage` is implemented as "`a` percent of `b`" (i.e. `(a / 100) * b`); no alternative interpretation is supported.
- Chained calculations (e.g. `5 + 3 + 2`) are resolved client-side by issuing sequential requests to the two-operand API; the backend itself has no concept of multi-operand expressions.

## 17. Future Improvements

The following are potential ideas for future iterations and are **not** part of the current implementation:

- Persisting a calculation history
- Adding authentication if the API were to be exposed beyond a trusted local context
- Supporting additional mathematical operations
- Adding Swagger/OpenAPI documentation for the API
- Adding a CI/CD pipeline to automate test execution and image builds
- Adding structured logging and basic observability (request metrics, error rates)