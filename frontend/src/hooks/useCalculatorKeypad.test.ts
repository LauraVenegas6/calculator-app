import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCalculatorKeypad } from "./useCalculatorKeypad";
import { calculate, CalculatorApiError } from "../api/calculatorApi";

vi.mock("../api/calculatorApi", async () => {
  const actual = await vi.importActual<typeof import("../api/calculatorApi")>(
    "../api/calculatorApi"
  );
  return {
    ...actual,
    calculate: vi.fn(),
  };
});

const mockedCalculate = vi.mocked(calculate);

beforeEach(() => {
  mockedCalculate.mockReset();
});

describe("useCalculatorKeypad", () => {
  // --- 1. Initial render ---
  it("starts at 0, with no pending operation and no error", () => {
    const { result } = renderHook(() => useCalculatorKeypad());

    expect(result.current.state.display).toBe("0");
    expect(result.current.state.accumulator).toBeNull();
    expect(result.current.state.pendingOperation).toBeNull();
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.loading).toBe(false);
  });

  // --- 4. Input validation ---
  describe("input validation", () => {
    it("does not allow a second decimal point", () => {
      const { result } = renderHook(() => useCalculatorKeypad());

      // inputDigit/inputDecimal use functional setState (prev => ...), so they can
      // be chained in the same act() without issue: each call operates on the real
      // result of the previous one, even without an intermediate re-render.
      act(() => {
        result.current.inputDigit("1");
        result.current.inputDecimal();
        result.current.inputDigit("5");
        result.current.inputDecimal(); // second attempt, should be ignored
      });

      expect(result.current.state.display).toBe("1.5");
    });

    it("does not allow the number to grow beyond the digit limit", () => {
      const { result } = renderHook(() => useCalculatorKeypad());

      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.inputDigit("9");
        }
      });

      expect(result.current.state.display).toHaveLength(15);
    });

    it("+/- does not affect 0 and does not break the pending operation", () => {
      const { result } = renderHook(() => useCalculatorKeypad());

      act(() => {
        result.current.toggleSign(); // on "0", this should do nothing
      });
      expect(result.current.state.display).toBe("0");

      // inputDigit("2") in its own act() so the hook re-renders before chooseOperator reads state.display.
      act(() => {
        result.current.inputDigit("2");
      });

      act(() => {
        result.current.chooseOperator("multiplication");
      });

      act(() => {
        result.current.toggleSign(); // still affects only the display
      });

      // The pending operation remains "multiplication", not "subtraction"
      expect(result.current.state.pendingOperation).toBe("multiplication");
      expect(result.current.state.accumulator).toBe(2);
    });
  });

  // --- 5. API call with the correct payload ---
  it("calls calculate with { operation, a, b } when resolving a binary operation", async () => {
    mockedCalculate.mockResolvedValueOnce(5);
    const { result } = renderHook(() => useCalculatorKeypad());

    act(() => {
      result.current.inputDigit("2");
    });

    act(() => {
      result.current.chooseOperator("addition");
    });

    act(() => {
      result.current.inputDigit("3");
    });

    await act(async () => {
      await result.current.equals();
    });

    expect(mockedCalculate).toHaveBeenCalledTimes(1);
    expect(mockedCalculate).toHaveBeenCalledWith({
      operation: "addition",
      a: 2,
      b: 3,
    });
  });

  // --- 6. Successful result ---
  it("updates the display and clears the pending operation when the API responds successfully", async () => {
    mockedCalculate.mockResolvedValueOnce(5);
    const { result } = renderHook(() => useCalculatorKeypad());

    act(() => {
      result.current.inputDigit("2");
    });

    act(() => {
      result.current.chooseOperator("addition");
    });

    act(() => {
      result.current.inputDigit("3");
    });

    await act(async () => {
      await result.current.equals();
    });

    expect(result.current.state.display).toBe("5");
    expect(result.current.state.accumulator).toBeNull();
    expect(result.current.state.pendingOperation).toBeNull();
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  // --- 7. Backend error ---
  it("shows the exact CalculatorApiError message", async () => {
    mockedCalculate.mockRejectedValueOnce(
      new CalculatorApiError("square root of negative number")
    );
    const { result } = renderHook(() => useCalculatorKeypad());

    act(() => {
      result.current.inputDigit("9");
    });

    act(() => {
      result.current.toggleSign(); // -9
    });

    await act(async () => {
      await result.current.applySquareRoot();
    });

    expect(result.current.state.error).toBe("square root of negative number");
    expect(result.current.state.display).toBe("0"); // returns to initial state
  });

  // --- 8. Network error ---
  it("shows a generic message when the error is not a CalculatorApiError", async () => {
    mockedCalculate.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { result } = renderHook(() => useCalculatorKeypad());

    act(() => {
      result.current.inputDigit("2");
    });

    act(() => {
      result.current.chooseOperator("division");
    });

    act(() => {
      result.current.inputDigit("3");
    });

    await act(async () => {
      await result.current.equals();
    });

    expect(result.current.state.error).toBe(
      "Could not reach the server. Please try again."
    );
  });

  // --- 9. Loading state ---
  it("sets loading to true while the calculate promise is pending", async () => {
    let resolvePromise: (value: number) => void;
    mockedCalculate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { result } = renderHook(() => useCalculatorKeypad());

    act(() => {
      result.current.inputDigit("2");
    });

    act(() => {
      result.current.chooseOperator("addition");
    });

    act(() => {
      result.current.inputDigit("3");
    });

    act(() => {
      result.current.equals(); // we do not wait, we want the intermediate state
    });

    await waitFor(() => expect(result.current.state.loading).toBe(true));

    act(() => {
      resolvePromise(5);
    });

    await waitFor(() => expect(result.current.state.loading).toBe(false));
    expect(result.current.state.display).toBe("5");
  });

  // --- 10. One operand (square_root) vs two operands (binary) ---
  it("square_root calls the API with a single operand, without `b`", async () => {
    mockedCalculate.mockResolvedValueOnce(4);
    const { result } = renderHook(() => useCalculatorKeypad());

    act(() => {
      result.current.inputDigit("1");
    });

    act(() => {
      result.current.inputDigit("6");
    });

    await act(async () => {
      await result.current.applySquareRoot();
    });

    expect(mockedCalculate).toHaveBeenCalledWith({
      operation: "square_root",
      a: 16,
    });
    expect(mockedCalculate.mock.calls[0][0]).not.toHaveProperty("b");
  });

  it("una operación binaria requiere resolver con dos operandos", async () => {
    mockedCalculate.mockResolvedValueOnce(6);
    const { result } = renderHook(() => useCalculatorKeypad());

    act(() => {
      result.current.inputDigit("2");
    });

    act(() => {
      result.current.chooseOperator("multiplication");
    });

    // Solo se eligió el operador; todavía no debería haberse llamado la API
    expect(mockedCalculate).not.toHaveBeenCalled();

    act(() => {
      result.current.inputDigit("3");
    });

    await act(async () => {
      await result.current.equals();
    });

    expect(mockedCalculate).toHaveBeenCalledWith({
      operation: "multiplication",
      a: 2,
      b: 3,
    });
  });

  it.each([
    ["subtraction", 5, 2, 3],
    ["exponentiation", 8, 2, 3],
    ["percentage", 20, 50, 40],
  ] as const)("resuelve %s correctamente", async (operation, expected, a, b) => {
    mockedCalculate.mockResolvedValueOnce(expected);
    const { result } = renderHook(() => useCalculatorKeypad());

    act(() => {
      result.current.inputDigit(String(a));
    });

    act(() => {
      result.current.chooseOperator(operation);
    });

    act(() => {
      result.current.inputDigit(String(b));
    });

    await act(async () => {
      await result.current.equals();
    });

    expect(mockedCalculate).toHaveBeenCalledWith({ operation, a, b });
    expect(result.current.state.display).toBe(String(expected));
  });
});