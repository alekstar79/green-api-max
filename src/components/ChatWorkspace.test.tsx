import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatWorkspace } from "./ChatWorkspace";

function renderWorkspace() {
  const onSendMessage = vi.fn();
  render(
    <ChatWorkspace
      chat={{ chatId: "10000000", phoneNumber: "79991234567" }}
      messages={[]}
      theme="light"
      polling="listening"
      pollingError={null}
      dialogOpen={false}
      checkingNumber={false}
      dialogError={null}
      sending={false}
      mobileChatOpen
      onCreateChat={vi.fn().mockResolvedValue(true)}
      onOpenDialog={vi.fn()}
      onCloseDialog={vi.fn()}
      onSendMessage={onSendMessage}
      onRetryMessage={vi.fn()}
      onToggleTheme={vi.fn()}
      onLogout={vi.fn()}
      onMobileBack={vi.fn()}
      onSelectChat={vi.fn()}
    />,
  );
  return onSendMessage;
}

describe("ChatWorkspace composer", () => {
  it("keeps send disabled for empty text and enables it at 4000 characters", () => {
    renderWorkspace();
    const textbox = screen.getByRole("textbox", { name: "Написать сообщение" });
    const sendButton = screen.getByRole("button", { name: "Отправить сообщение" });

    expect(sendButton).toBeDisabled();
    fireEvent.change(textbox, { target: { value: "x".repeat(4000) } });
    expect(sendButton).toBeEnabled();
    fireEvent.change(textbox, { target: { value: "x".repeat(4001) } });
    expect(sendButton).toBeDisabled();
  });

  it("submits the text and does not send an empty value", () => {
    const onSendMessage = renderWorkspace();
    const textbox = screen.getByRole("textbox", { name: "Написать сообщение" });
    fireEvent.change(textbox, { target: { value: "Привет" } });
    fireEvent.click(screen.getByRole("button", { name: "Отправить сообщение" }));

    expect(onSendMessage).toHaveBeenCalledWith("Привет");
    expect(onSendMessage).toHaveBeenCalledTimes(1);
  });
});