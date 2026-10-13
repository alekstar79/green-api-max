import { useCallback, useMemo, useState } from "react";
import type { Credentials } from "@/entities/credentials";
import { useMessages, type ChatMessage } from "@/entities/message";
import { useCredentials } from "@/features/connect-instance";
import { useChat } from "@/features/create-chat";
import { useNotificationPolling } from "@/features/receive-messages";
import { useSendMessage } from "@/features/send-message";
import { useTheme } from "@/features/toggle-theme";

// Keep cross-feature coordination here so App remains a composition-only root.
export function useAppState() {
  const { client, connect, reset: resetCredentials } = useCredentials();
  const { chat, checkingNumber, dialogError, dialogOpen, createChat, openDialog, closeDialog, reset: resetChat } = useChat(client);
  const { messages, addIncoming, addOutgoing, confirmSent, markFailed, clear } = useMessages();
  const { theme, toggleTheme } = useTheme();
  const { status: pollingStatus, error: pollingError } = useNotificationPolling(client, chat?.chatId ?? null, addIncoming);
  const { sendMessage, retryMessage, sending } = useSendMessage(client, chat?.chatId ?? null, {
    addOutgoing,
    confirmSent,
    markFailed,
  });
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const onConnect = useCallback((credentials: Credentials) => {
    connect(credentials);
    clear();
    setMobileChatOpen(false);
  }, [clear, connect]);

  const onCreateChat = useCallback(async (phoneNumber: string) => {
    const created = await createChat(phoneNumber);
    if (created) {
      clear();
      setMobileChatOpen(true);
    }
    return created;
  }, [clear, createChat]);

  const onOpenDialog = useCallback(() => openDialog(), [openDialog]);
  const onCloseDialog = useCallback(() => closeDialog(), [closeDialog]);
  const onSendMessage = useCallback((text: string) => { void sendMessage(text); }, [sendMessage]);
  const onRetryMessage = useCallback((message: ChatMessage) => { void retryMessage(message); }, [retryMessage]);
  const onToggleTheme = useCallback(() => toggleTheme(), [toggleTheme]);
  const onLogout = useCallback(() => {
    resetCredentials();
    resetChat();
    clear();
    setMobileChatOpen(false);
  }, [clear, resetChat, resetCredentials]);
  const onSelectChat = useCallback(() => setMobileChatOpen((current) => !current), []);
  const onMobileBack = useCallback(() => setMobileChatOpen(false), []);

  return useMemo(() => ({
    client,
    chat,
    messages,
    theme,
    polling: { status: pollingStatus, error: pollingError },
    dialogOpen,
    checkingNumber,
    dialogError,
    sending,
    mobileChatOpen,
    onConnect,
    onCreateChat,
    onOpenDialog,
    onCloseDialog,
    onSendMessage,
    onRetryMessage,
    onToggleTheme,
    onLogout,
    onSelectChat,
    onMobileBack,
  }), [chat, checkingNumber, client, dialogError, dialogOpen, messages, mobileChatOpen, onCloseDialog, onConnect, onCreateChat, onLogout, onMobileBack, onOpenDialog, onRetryMessage, onSelectChat, onSendMessage, onToggleTheme, pollingError, pollingStatus, sending, theme]);
}
