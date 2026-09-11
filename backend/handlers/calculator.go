// Package handlers contains HTTP handlers that translate between
// HTTP requests/responses and the application's service layer.
// Handlers must not contain business or mathematical logic; that
// responsibility belongs exclusively to the service layer.
package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"calculator/backend/model"
	"calculator/backend/services"
)

// CalculatorHandler handles POST /api/calculate.
//
// Its sole responsibility is to:
//  1. Decode and validate the incoming JSON request.
//  2. Delegate the actual calculation to the service layer.
//  3. Translate the service's result or error into an HTTP response.
//
// No arithmetic or business rule is implemented here.
func CalculatorHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req model.CalculationRequest

	// Step 1: decode JSON. A malformed body is a transport-level
	// error, so it belongs here, not in the service.
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	// Step 2: structural validation. This checks the *shape* of the
	// request, not its business meaning (e.g. "operation is missing"
	// is structural; "division by zero" is business logic and is
	// validated inside the service).
	if req.Operation == "" {
		writeError(w, http.StatusBadRequest, "field 'operation' is required")
		return
	}

	// Step 3: delegate to the service. The handler has no knowledge
	// of how each operation is computed.
	result, err := services.Calculate(req.Operation, req.A, req.B)
	if err != nil {
		status := mapServiceErrorToStatus(err)
		writeError(w, status, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, model.CalculationResponse{Result: result})
}

// mapServiceErrorToStatus translates known business errors returned by
// the service layer into appropriate HTTP status codes. Any error not
// explicitly recognized is treated as an unexpected internal error.
func mapServiceErrorToStatus(err error) int {
	switch {
	case errors.Is(err, services.ErrDivisionByZero),
		errors.Is(err, services.ErrNegativeSqrt),
		errors.Is(err, services.ErrUnknownOperation),
		errors.Is(err, services.ErrMissingOperand):
		return http.StatusBadRequest
	default:
		return http.StatusInternalServerError
	}
}

// writeJSON writes a JSON-encoded payload with the given HTTP status code.
func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// writeError writes a JSON error response using model.ErrorResponse,
// ensuring all error bodies share a consistent shape.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, model.ErrorResponse{Error: message})
}
