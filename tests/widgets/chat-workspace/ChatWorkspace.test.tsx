import { fireEvent, render, screen } from "@testing-library/react";
import { Profiler, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ChatProvider } from "@/app/model/chat-context";
import { ComposerProvider } from "@/app/model/composer-context";
import { DialogProvider } from "@/app/model/dialog-context";
import { ChatSidebar } from "@/widgets/chat-workspace/ui/ChatSidebar";
import { ChatWorkspace } from "@/widgets/chat-workspace";

const sidebarChatValue = {
  chat: { chatId: "10000000", phoneNumber: "79991234567" },
  pollStatus: "listening" as const,
  pollError: null,
  onSelectChat: vi.fn(),
  onMobileBack: vi.fn(),
  mobileChatOpen: true,
};

const sidebarDialogValue = {
  dialogOpen: false,
  checkingNumber: false,
  dialogError: null,
  onCreateChat: vi.fn().mockResolvedValue(true),
  onOpenDialog: vi.fn(),
  onCloseDialog: vi.fn(),
};

function renderWorkspace() {
  const onSendMessage = vi.fn();
  render(
    <ChatProvider value={{
      chat: { chatId: "10000000", phoneNumber: "79991234567" },
      pollStatus: "listening",
      pollError: null,
      onSelectChat: vi.fn(),
      onMobileBack: vi.fn(),
      mobileChatOpen: true,
    }}>
      <ComposerProvider value={{
        onSendMessage,
        onRetryMessage: vi.fn(),
        sending: false,
      }}>
        <DialogProvider value={{
          dialogOpen: false,
          checkingNumber: false,
          dialogError: null,
          onCreateChat: vi.fn().mockResolvedValue(true),
          onOpenDialog: vi.fn(),
          onCloseDialog: vi.fn(),
        }}>
          <ChatWorkspace
            messages={[]}
            theme="light"
            onToggleTheme={vi.fn()}
            onLogout={vi.fn()}
          />
        </DialogProvider>
      </ComposerProvider>
    </ChatProvider>,
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

  it("does not commit ChatSidebar while the composer draft changes", () => {
    const onSidebarCommit = vi.fn();
    function ComposerAndSidebar() {
      const [draft, setDraft] = useState("");
      return (
        <ChatProvider value={sidebarChatValue}>
          <DialogProvider value={sidebarDialogValue}>
            <Profiler id="chat-sidebar" onRender={onSidebarCommit}>
              <ChatSidebar
                chat={sidebarChatValue.chat}
                latestMessage={undefined}
                onSelectChat={sidebarChatValue.onSelectChat}
                onOpenDialog={sidebarDialogValue.onOpenDialog}
              />
            </Profiler>
            <textarea
              aria-label="Написать сообщение"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </DialogProvider>
        </ChatProvider>
      );
    }

    render(<ComposerAndSidebar />);
    expect(onSidebarCommit).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole("textbox", { name: "Написать сообщение" }), {
      target: { value: "Набираю текст" },
    });
    const [, , actualDuration, baseDuration] = onSidebarCommit.mock.calls[1] ?? [];
    expect(actualDuration).toBeLessThan(baseDuration);
  });
});