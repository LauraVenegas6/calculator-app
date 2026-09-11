import type { CalculationRequest, CalculationResponse, ErrorResponse } from "../types/calculator";

const API_BASE_URL = "/api";

export class CalculatorApiError extends Error {}

export async function calculate(request: CalculationRequest): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const body = await response.json();

  if (!response.ok) {
    const errorBody = body as ErrorResponse;
    throw new CalculatorApiError(errorBody.error ?? "Unexpected error");
  }

  return (body as CalculationResponse).result;
}
