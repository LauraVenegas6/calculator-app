import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calculator } from "./Calculator";
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

function press(label: string) {
  return screen.getByRole("button", { name: label });
}

// The keyboard always has visible "0"-"9" buttons, so getByText("5")
// is ambiguous between the button and the display value. This helper targets
// the display node directly by its data-testid, without ambiguity.
function displayValue() {
  return screen.getByTestId("display-value");
}

beforeEach(() => {
  mockedCalculate.mockReset();
});

describe("<Calculator /> (integration, user behavior)", () => {
  // --- 1. Initial render ---
  it("shows 0 when mounted, with no visible error", () => {
    render(<Calculator />);

    expect(displayValue()).toHaveTextContent("0");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // --- 2. Operation selection ---
  it("shows the pending operator without triggering the API yet", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(press("2"));
    await user.click(press("Multiply"));

    expect(screen.getByTestId("display-expression")).toHaveTextContent("2 ×");
    expect(mockedCalculate).not.toHaveBeenCalled();
  });

  // --- 3. Inputs, including the negative-sign regression ---
  describe("inputs", () => {
    it("concatenates digits and prevents duplicate decimal points", async () => {
      const user = userEvent.setup();
      render(<Calculator />);

      await user.click(press("1"));
      await user.click(press("2"));
      await user.click(press("Decimal point"));
      await user.click(press("5"));
      await user.click(press("Decimal point"));

      expect(displayValue()).toHaveTextContent("12.5");
    });

    it("AC resets everything and Backspace removes the last character", async () => {
      const user = userEvent.setup();
      render(<Calculator />);

      await user.click(press("1"));
      await user.click(press("2"));
      await user.click(press("Backspace"));
      expect(displayValue()).toHaveTextContent("1");

      await user.click(press("Clear"));
      expect(displayValue()).toHaveTextContent("0");
    });

    it("regression: +/- allows a negative number without losing the chosen operator (2 * -3)", async () => {
      mockedCalculate.mockResolvedValueOnce(-6);
      const user = userEvent.setup();
      render(<Calculator />);

      await user.click(press("2"));
      await user.click(press("Multiply"));
      await user.click(press("3"));
      await user.click(press("Toggle sign"));
      await user.click(press("Equals"));

      await waitFor(() =>
        expect(mockedCalculate).toHaveBeenCalledWith({
          operation: "multiplication",
          a: 2,
          b: -3,
        })
      );
    });
  });

  // --- 4. Validation ---
  it("does not allow more than 15 digits", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    for (const digit of "9".repeat(20)) {
      await user.click(press(digit));
    }

    expect(displayValue()).toHaveTextContent("9".repeat(15));
  });

  // --- 5 and 6. API call + successful result ---
  it("when = is pressed, it calls the API and shows the result", async () => {
    mockedCalculate.mockResolvedValueOnce(5);
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(press("2"));
    await user.click(press("Add"));
    await user.click(press("3"));
    await user.click(press("Equals"));

    expect(mockedCalculate).toHaveBeenCalledWith({
      operation: "addition",
      a: 2,
      b: 3,
    });
    await waitFor(() => expect(displayValue()).toHaveTextContent("5"));
  });

  // --- 7. Backend error ---
  it("shows the backend message when the API responds with an error", async () => {
    mockedCalculate.mockRejectedValueOnce(
      new CalculatorApiError("square root of negative number")
    );
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(press("9"));
    await user.click(press("Toggle sign"));
    await user.click(press("Square root"));

    expect(
      await screen.findByText("square root of negative number")
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  // --- 8. Network error ---
  it("shows a generic message if the connection fails", async () => {
    mockedCalculate.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(press("2"));
    await user.click(press("Divide"));
    await user.click(press("3"));
    await user.click(press("Equals"));

    expect(
      await screen.findByText("Could not reach the server. Please try again.")
    ).toBeInTheDocument();
  });

  // --- 9. Loading state ---
  it("disables the keyboard and shows the loading indicator while waiting for the API", async () => {
    let resolvePromise: (value: number) => void;
    mockedCalculate.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(press("2"));
    await user.click(press("Add"));
    await user.click(press("3"));
    await user.click(press("Equals"));

    expect(press("Clear")).toBeDisabled();
    expect(displayValue()).toHaveTextContent("···");

    resolvePromise!(5);

    await waitFor(() => expect(press("Clear")).not.toBeDisabled());
    expect(displayValue()).toHaveTextContent("5");
  });

  // --- 10. One operand vs two operands ---
  it("√ resolves with a single operand without needing =", async () => {
    mockedCalculate.mockResolvedValueOnce(4);
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(press("1"));
    await user.click(press("6"));
    await user.click(press("Square root"));

    expect(mockedCalculate).toHaveBeenCalledWith({
      operation: "square_root",
      a: 16,
    });
    await waitFor(() => expect(displayValue()).toHaveTextContent("4"));
  });

  it("a binary operation does not call the API until the second operand is present", async () => {
    const user = userEvent.setup();
    render(<Calculator />);

    await user.click(press("2"));
    await user.click(press("Multiply"));

    expect(mockedCalculate).not.toHaveBeenCalled();
  });
});
