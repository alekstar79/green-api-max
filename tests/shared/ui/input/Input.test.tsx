import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/shared/ui/input";

describe("Input", () => {
  it("associates its label with the input", () => {
    render(<Input id="phone" label="Phone number" />);
    expect(screen.getByRole("textbox", { name: "Phone number" })).toBeInTheDocument();
  });

  it("exposes invalid state and error text accessibly", () => {
    render(<Input id="phone" label="Phone number" error="Enter a valid number" />);
    expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid number");
  });
});