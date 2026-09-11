package services

import (
	"errors"
	"math"

	"calculator/backend/model"
)

// Business errors are exposed as sentinels so upper layers, such as
// handlers, can identify them with errors.Is() and map them to specific
// HTTP status codes without coupling to text messages.
var (
	ErrDivisionByZero   = errors.New("cannot divide by zero")
	ErrNegativeSqrt     = errors.New("cannot calculate square root of a negative number")
	ErrUnknownOperation = errors.New("unsupported calculator operation")
	ErrMissingOperand   = errors.New("operand b is required for this operation")
)

// Calculate executes the requested operation with the provided operands.
// b is optional: it is only required for binary operations. For SquareRoot,
// b may be nil.
func Calculate(op model.Operation, a float64, b *float64) (float64, error) {
	switch op {
	case model.Addition:
		if b == nil {
			return 0, ErrMissingOperand
		}
		return a + *b, nil

	case model.Subtraction:
		if b == nil {
			return 0, ErrMissingOperand
		}
		return a - *b, nil

	case model.Multiplication:
		if b == nil {
			return 0, ErrMissingOperand
		}
		return a * *b, nil

	case model.Division:
		if b == nil {
			return 0, ErrMissingOperand
		}
		if *b == 0 {
			return 0, ErrDivisionByZero
		}
		return a / *b, nil

	case model.Exponentiation:
		if b == nil {
			return 0, ErrMissingOperand
		}
		return math.Pow(a, *b), nil

	case model.SquareRoot:
		if a < 0 {
			return 0, ErrNegativeSqrt
		}
		return math.Sqrt(a), nil

	case model.Percentage:
		// Computes a percent of b. For example, Percentage(20, 50) returns 10.
		if b == nil {
			return 0, ErrMissingOperand
		}
		return (a / 100) * *b, nil

	default:
		return 0, ErrUnknownOperation
	}
}
