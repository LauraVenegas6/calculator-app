package services

import (
	"errors"
	"math"
	"testing"

	"calculator/backend/model"
)

// floatEquals compares floats with a tolerance, which is necessary for
// cases such as sqrt(2) where exact equality with == is unreliable.
const epsilon = 1e-9

func floatEquals(a, b float64) bool {
	return math.Abs(a-b) < epsilon
}

// ptr is a helper for building *float64 values inline in the test table,
// since model.CalculationRequest uses pointers for operand B.
func ptr(f float64) *float64 {
	return &f
}

func TestCalculate(t *testing.T) {
	tests := []struct {
		name      string
		operation model.Operation
		a         float64
		b         *float64
		want      float64
		wantErr   error
	}{
		// Valid cases
		{"addition happy path", model.Addition, 2, ptr(3), 5, nil},
		{"subtraction happy path", model.Subtraction, 5, ptr(3), 2, nil},
		{"multiplication happy path", model.Multiplication, 4, ptr(3), 12, nil},
		{"division happy path", model.Division, 10, ptr(2), 5, nil},
		{"exponentiation happy path", model.Exponentiation, 2, ptr(3), 8, nil},
		{"square root happy path", model.SquareRoot, 9, nil, 3, nil},
		{"percentage happy path", model.Percentage, 20, ptr(50), 10, nil},

		// Zero values
		{"addition with zeros", model.Addition, 0, ptr(0.0), 0, nil},
		{"multiplication by zero", model.Multiplication, 0, ptr(5.0), 0, nil},
		{"exponent zero", model.Exponentiation, 5, ptr(0.0), 1, nil},
		{"square root of zero", model.SquareRoot, 0, nil, 0, nil},

		// Negative numbers
		{"addition negatives", model.Addition, -2, ptr(-3.0), -5, nil},
		{"subtraction negative result", model.Subtraction, -5, ptr(3.0), -8, nil},
		{"multiplication negative", model.Multiplication, -4, ptr(3.0), -12, nil},
		{"division negative", model.Division, -10, ptr(2.0), -5, nil},

		// Decimal numbers
		{"division decimal result", model.Division, 5, ptr(2.0), 2.5, nil},
		{"addition decimals", model.Addition, 1.5, ptr(2.25), 3.75, nil},
		{"square root non-perfect square", model.SquareRoot, 2, nil, math.Sqrt2, nil},

		// Division by zero
		{"division by zero", model.Division, 10, ptr(0.0), 0, ErrDivisionByZero},
		{"zero divided by zero", model.Division, 0, ptr(0.0), 0, ErrDivisionByZero},

		// Square root of a negative number
		{"square root of negative", model.SquareRoot, -9, nil, 0, ErrNegativeSqrt},

		// Unknown operations
		{"unknown operation", model.Operation("modulo"), 5, ptr(2.0), 0, ErrUnknownOperation},
		{"empty operation", model.Operation(""), 5, ptr(2.0), 0, ErrUnknownOperation},

		// Missing operand (invalid input)
		{"addition missing b", model.Addition, 5, nil, 0, ErrMissingOperand},
		{"division missing b", model.Division, 5, nil, 0, ErrMissingOperand},
		{"percentage missing b", model.Percentage, 5, nil, 0, ErrMissingOperand},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.operation, tt.a, tt.b)

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("expected error %v, got %v", tt.wantErr, err)
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if !floatEquals(got, tt.want) {
				t.Errorf("expected result %v, got %v", tt.want, got)
			}
		})
	}
}
