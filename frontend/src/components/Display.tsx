import type { Operation } from "../types/calculator";

const OPERATOR_SYMBOLS: Record<Operation, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
  exponentiation: "^",
  square_root: "√",
  percentage: "%",
};

interface DisplayProps {
  value: string;
  accumulator: number | null;
  pendingOperation: Operation | null;
  loading: boolean;
}

export function Display({ value, accumulator, pendingOperation, loading }: DisplayProps) {
  const expression =
    accumulator !== null && pendingOperation !== null
      ? `${accumulator} ${OPERATOR_SYMBOLS[pendingOperation]}`
      : "";

  return (
    <div className={`display ${loading ? "display-loading" : ""}`} role="status" aria-live="polite">
      <div className="display-expression" data-testid="display-expression">
        {expression || "\u00A0"}
      </div>
      <div className="display-value" data-testid="display-value">
        {loading ? "···" : value}
      </div>
    </div>
  );
}