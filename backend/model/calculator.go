package model

// Operation represents the type of operation supported by the API.
// A named string type is used instead of a numeric enum so the JSON stays
// human-readable and self-explanatory.
type Operation string

const (
	Addition       Operation = "addition"
	Subtraction    Operation = "subtraction"
	Multiplication Operation = "multiplication"
	Division       Operation = "division"
	Exponentiation Operation = "exponentiation"
	SquareRoot     Operation = "square_root"
	Percentage     Operation = "percentage"
)

// CalculationRequest represents the request body for POST /api/calculate.
//
// B is a pointer because some operations, such as SquareRoot, only require
// one operand. Using *float64 lets the API distinguish between "B was not
// provided" and "B was provided as 0".
type CalculationRequest struct {
	Operation Operation `json:"operation"`
	A         float64   `json:"a"`
	B         *float64  `json:"b,omitempty"`
}

// CalculationResponse represents a successful response body.
type CalculationResponse struct {
	Result float64 `json:"result"`
}

// ErrorResponse represents the response body returned when an error occurs
// during validation or business logic. It stays separate from
// CalculationResponse so handlers do not need to mix partial results and
// error messages in the same structure.
type ErrorResponse struct {
	Error string `json:"error"`
}
