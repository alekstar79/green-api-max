import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NewChatDialog } from "@/features/create-chat/ui/NewChatDialog";

describe("NewChatDialog", () => {
  it("does not call the API for an invalid phone number", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn<(_: string) => Promise<boolean>>().mockResolvedValue(true);
    render(<NewChatDialog busy={false} error={null} onClose={vi.fn()} onCreate={onCreate} />);

    await user.type(screen.getByLabelText("Номер телефона"), "12345");
    await user.click(screen.getByRole("button", { name: "Создать чат" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Укажите номер РФ или Беларуси");
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("normalizes a valid phone before creating the chat", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn<(_: string) => Promise<boolean>>().mockResolvedValue(true);
    render(<NewChatDialog busy={false} error={null} onClose={vi.fn()} onCreate={onCreate} />);

    await user.type(screen.getByLabelText("Номер телефона"), "+7 (999) 123-45-67");
    await user.click(screen.getByRole("button", { name: "Создать чат" }));

    expect(onCreate).toHaveBeenCalledWith("79991234567");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NewChatDialog busy={false} error={null} onClose={onClose} onCreate={vi.fn()} />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps keyboard focus inside the dialog", async () => {
    const user = userEvent.setup();
    render(<NewChatDialog busy={false} error={null} onClose={vi.fn()} onCreate={vi.fn()} />);
    const closeButton = screen.getByRole("button", { name: "Закрыть окно создания чата" });

    closeButton.focus();
    await user.tab();
    expect(screen.getByLabelText("Номер телефона")).toHaveFocus();

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(closeButton).toHaveFocus();
  });
});