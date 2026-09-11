import { useCalculatorKeypad } from "../hooks/useCalculatorKeypad";
import { Display } from "./Display";
import { Keypad } from "./Keypad";
import { ErrorMessage } from "./ErrorMessage";

export function Calculator() {
  const {
    state,
    inputDigit,
    inputDecimal,
    backspace,
    clear,
    toggleSign,
    chooseOperator,
    equals,
    applySquareRoot,
  } = useCalculatorKeypad();

  return (
    <main className="calculator" aria-labelledby="calculator-title">
      <h1 id="calculator-title" className="sr-only">Calculator</h1>

      <div className="calculator-glow" aria-hidden="true" />

      <Display
        value={state.display}
        accumulator={state.accumulator}
        pendingOperation={state.pendingOperation}
        loading={state.loading}
      />

      {state.error && <ErrorMessage message={state.error} />}

      <Keypad
        loading={state.loading}
        onDigit={inputDigit}
        onDecimal={inputDecimal}
        onBackspace={backspace}
        onClear={clear}
        onToggleSign={toggleSign}
        onOperator={chooseOperator}
        onEquals={equals}
        onSquareRoot={applySquareRoot}
      />
    </main>
  );
}
