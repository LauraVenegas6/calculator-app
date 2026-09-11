import { useCallback, useState } from "react";
import { calculate, CalculatorApiError } from "../api/calculatorApi";
import type { Operation } from "../types/calculator";

interface KeypadState {
  display: string;
  accumulator: number | null;
  pendingOperation: Operation | null;
  overwrite: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: KeypadState = {
  display: "0",
  accumulator: null,
  pendingOperation: null,
  overwrite: true,
  loading: false,
  error: null,
};

const MAX_DIGITS = 15;

function toNetworkErrorMessage(err: unknown): string {
  return err instanceof CalculatorApiError
    ? err.message
    : "Could not reach the server. Please try again.";
}

// Drives a physical-calculator-style keypad. All arithmetic still
// happens on the backend; this hook only manages what's on screen and
// when to call the API — exactly like a real calculator chains binary
// operations instead of doing n-ary math internally.
export function useCalculatorKeypad() {
  const [state, setState] = useState<KeypadState>(initialState);

  const inputDigit = useCallback((digit: string) => {
    setState((prev) => {
      if (prev.loading) return prev;
      if (prev.overwrite) {
        return { ...prev, display: digit, overwrite: false, error: null };
      }
      const digitsOnly = prev.display.replace("-", "").replace(".", "");
      if (digitsOnly.length >= MAX_DIGITS) return prev;
      const next = prev.display === "0" ? digit : prev.display + digit;
      return { ...prev, display: next, error: null };
    });
  }, []);

  const inputDecimal = useCallback(() => {
    setState((prev) => {
      if (prev.loading) return prev;
      if (prev.overwrite) {
        return { ...prev, display: "0.", overwrite: false, error: null };
      }
      if (prev.display.includes(".")) return prev;
      return { ...prev, display: prev.display + ".", error: null };
    });
  }, []);

  const backspace = useCallback(() => {
    setState((prev) => {
      if (prev.loading || prev.overwrite) return prev;
      const next = prev.display.slice(0, -1);
      return { ...prev, display: next === "" || next === "-" ? "0" : next };
    });
  }, []);

  const clear = useCallback(() => {
    setState(initialState);
  }, []);

  // Flips the sign of whatever is currently on screen. This is the fix
  // for the "2 * -3" bug: previously the only way to get a minus sign
  // in front of a number was to press the subtraction operator, which
  // chooseOperator interprets as "replace the pending operation" (since
  // overwrite is still true right after picking an operator). A negative
  // number and the subtraction operator are two different things and
  // need two different buttons — this is the second one. It only edits
  // the display string, so it never touches accumulator/pendingOperation
  // and never needs to hit the backend.
  const toggleSign = useCallback(() => {
    setState((prev) => {
      if (prev.loading || prev.display === "0") return prev;
      const next = prev.display.startsWith("-")
        ? prev.display.slice(1)
        : `-${prev.display}`;
      return { ...prev, display: next, error: null };
    });
  }, []);

  // The only place that calls the backend for a two-operand operation.
  const runBinary = useCallback(
    async (a: number, b: number, operation: Operation): Promise<number | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await calculate({ operation, a, b });
        return result;
      } catch (err) {
        setState({ ...initialState, error: toNetworkErrorMessage(err) });
        return null;
      }
    },
    []
  );

  // Pressing +, −, ×, ÷, ^ or %. If an operation is already pending,
  // it's resolved first — this is the "chaining" behavior that lets
  // the user add/multiply/etc. more than two numbers in sequence.
  const chooseOperator = useCallback(
    async (operation: Operation) => {
      const current = parseFloat(state.display);

      if (state.pendingOperation !== null && state.accumulator !== null && !state.overwrite) {
        const result = await runBinary(state.accumulator, current, state.pendingOperation);
        if (result === null) return;
        setState((prev) => ({
          ...prev,
          accumulator: result,
          display: String(result),
          pendingOperation: operation,
          overwrite: true,
          loading: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        accumulator: current,
        pendingOperation: operation,
        overwrite: true,
        error: null,
      }));
    },
    [state.display, state.pendingOperation, state.accumulator, state.overwrite, runBinary]
  );

  // Pressing "=" resolves whatever operation is currently pending.
  const equals = useCallback(async () => {
    if (state.pendingOperation === null || state.accumulator === null) return;
    const current = parseFloat(state.display);
    const result = await runBinary(state.accumulator, current, state.pendingOperation);
    if (result === null) return;
    setState((prev) => ({
      ...prev,
      display: String(result),
      accumulator: null,
      pendingOperation: null,
      overwrite: true,
      loading: false,
    }));
  }, [state.pendingOperation, state.accumulator, state.display, runBinary]);

  // Square root is unary: applies immediately to the current display
  // value without needing "=" and without disturbing a pending chain.
  const applySquareRoot = useCallback(async () => {
    const current = parseFloat(state.display);
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await calculate({ operation: "square_root", a: current });
      setState((prev) => ({ ...prev, display: String(result), loading: false, overwrite: true }));
    } catch (err) {
      setState({ ...initialState, error: toNetworkErrorMessage(err) });
    }
  }, [state.display]);

  return {
    state,
    inputDigit,
    inputDecimal,
    backspace,
    clear,
    toggleSign,
    chooseOperator,
    equals,
    applySquareRoot,
  };
}
