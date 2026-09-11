export type Operation =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division"
  | "exponentiation"
  | "square_root"
  | "percentage";

export interface CalculationRequest {
  operation: Operation;
  a: number;
  b?: number;
}

export interface CalculationResponse {
  result: number;
}

export interface ErrorResponse {
  error: string;
}
