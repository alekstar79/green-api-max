import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/shared/ui/button";

describe("Button", () => {
  it("renders its content and forwards onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Send</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not invoke onClick when disabled", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Send</Button>);

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});