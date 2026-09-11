import type { Operation } from "../types/calculator";

interface KeypadProps {
  loading: boolean;
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onToggleSign: () => void;
  onOperator: (operation: Operation) => void;
  onEquals: () => void;
  onSquareRoot: () => void;
}

export function Keypad({
  loading,
  onDigit,
  onDecimal,
  onBackspace,
  onClear,
  onToggleSign,
  onOperator,
  onEquals,
  onSquareRoot,
}: KeypadProps) {
  return (
    <div className="keypad">
      <button type="button" className="key key-clear" onClick={onClear} disabled={loading} aria-label="Clear">AC</button>
      <button type="button" className="key key-action" onClick={onBackspace} disabled={loading} aria-label="Backspace">⌫</button>
      <button type="button" className="key key-operator" onClick={() => onOperator("percentage")} disabled={loading} aria-label="Percentage">%</button>
      <button type="button" className="key key-operator" onClick={() => onOperator("division")} disabled={loading} aria-label="Divide">÷</button>

      <button type="button" className="key key-digit" onClick={() => onDigit("7")} disabled={loading}>7</button>
      <button type="button" className="key key-digit" onClick={() => onDigit("8")} disabled={loading}>8</button>
      <button type="button" className="key key-digit" onClick={() => onDigit("9")} disabled={loading}>9</button>
      <button type="button" className="key key-operator" onClick={() => onOperator("multiplication")} disabled={loading} aria-label="Multiply">×</button>

      <button type="button" className="key key-digit" onClick={() => onDigit("4")} disabled={loading}>4</button>
      <button type="button" className="key key-digit" onClick={() => onDigit("5")} disabled={loading}>5</button>
      <button type="button" className="key key-digit" onClick={() => onDigit("6")} disabled={loading}>6</button>
      <button type="button" className="key key-operator" onClick={() => onOperator("subtraction")} disabled={loading} aria-label="Subtract">−</button>

      <button type="button" className="key key-digit" onClick={() => onDigit("1")} disabled={loading}>1</button>
      <button type="button" className="key key-digit" onClick={() => onDigit("2")} disabled={loading}>2</button>
      <button type="button" className="key key-digit" onClick={() => onDigit("3")} disabled={loading}>3</button>
      <button type="button" className="key key-operator" onClick={() => onOperator("addition")} disabled={loading} aria-label="Add">+</button>

      <button type="button" className="key key-unary" onClick={onSquareRoot} disabled={loading} aria-label="Square root">√</button>
      <button type="button" className="key key-operator" onClick={() => onOperator("exponentiation")} disabled={loading} aria-label="Exponent">^</button>
      <button type="button" className="key key-unary" onClick={onToggleSign} disabled={loading} aria-label="Toggle sign">+/−</button>
      <button type="button" className="key key-equals" onClick={onEquals} disabled={loading} aria-label="Equals">=</button>

      <button type="button" className="key key-digit key-zero" onClick={() => onDigit("0")} disabled={loading}>0</button>
      <button type="button" className="key key-digit" onClick={onDecimal} disabled={loading} aria-label="Decimal point">.</button>
    </div>
  );
}
