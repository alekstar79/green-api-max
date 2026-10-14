import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "@/shared/ui/dialog";

describe("Dialog", () => {
  it("traps focus, closes with Escape, and closes on backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog open title="New chat" onClose={onClose}>
        <button type="button">Continue</button>
      </Dialog>,
    );

    const closeButton = screen.getByRole("button", { name: "Закрыть окно" });
    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(closeButton).toHaveFocus();
    await user.tab();
    expect(continueButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();

    onClose.mockClear();
    const backdrop = screen.getByRole("dialog").parentElement;
    if (!backdrop) throw new Error("Dialog backdrop is missing");
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });
});