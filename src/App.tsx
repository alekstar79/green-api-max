import { useEffect, useRef, useState } from "react";
import { ChatWorkspace } from "./components/ChatWorkspace";
import { ConnectionForm } from "./components/ConnectionForm";
import {
  createGreenApiClient,
  GreenApiError,
  isAbortError,
  type Credentials,
  type GreenApiClient,
} from "./lib/api/greenApi";
import type { ChatContact, ChatMessage, Theme } from "./types/chat";

function waitFor(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const finish = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timeoutId = setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
  });
}

function errorMessage(error: unknown): string {
  return error instanceof GreenApiError
    ? error.message
    : "Не удалось завершить запрос. Проверьте сеть и попробуйте ещё раз.";
}

export function App() {
  const [client, setClient] = useState<GreenApiClient | null>(null);
  const [chat, setChat] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [theme, setTheme] = useState<Theme>("light");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [polling, setPolling] = useState<"idle" | "listening" | "retrying">("idle");
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [sendingCount, setSendingCount] = useState(0);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const processedMessageIds = useRef(new Set<string>());
  const nextLocalMessageId = useRef(0);
  const chatId = chat?.chatId ?? null;

  function handleConnect(credentials: Credentials) {
    setClient(createGreenApiClient(credentials));
    setChat(null);
    setMessages([]);
    processedMessageIds.current.clear();
    setPolling("idle");
  }

  async function handleCreateChat(phoneNumber: string): Promise<boolean> {
    if (!client) {
      return false;
    }
    setCheckingNumber(true);
    setDialogError(null);
    try {
      const result = await client.checkAccount(Number(phoneNumber));
      if (result.status === false) {
        setDialogError(result.reason ?? "Инстанс не готов к работе.");
        return false;
      }
      if (!result.exist || !result.chatId) {
        setDialogError("Для этого номера не найден аккаунт MAX.");
        return false;
      }
      setChat({ chatId: result.chatId, phoneNumber });
      setMessages([]);
      processedMessageIds.current.clear();
      setPollingError(null);
      setPolling("listening");
      setMobileChatOpen(true);
      return true;
    } catch (error) {
      setDialogError(errorMessage(error));
      return false;
    } finally {
      setCheckingNumber(false);
    }
  }

  async function sendMessage(text: string, existingId?: string) {
    if (!client || !chat || !text.trim() || sendingCount > 0) {
      return;
    }
    const id = existingId ?? `local-${Date.now()}-${nextLocalMessageId.current++}`;
    const message: ChatMessage = {
      id,
      text,
      direction: "outgoing",
      sentAt: Date.now(),
      status: "sending",
    };
    setSendingCount((count) => count + 1);
    setMessages((current) => existingId
      ? current.map((item) => item.id === id ? message : item)
      : [...current, message]);
    try {
      const result = await client.sendMessage(chat.chatId, text);
      setMessages((current) => current.map((item) => item.id === id
        ? { ...item, id: result.idMessage, status: "accepted" }
        : item));
    } catch {
      setMessages((current) => current.map((item) => item.id === id
        ? { ...item, status: "failed" }
        : item));
    } finally {
      setSendingCount((count) => Math.max(0, count - 1));
    }
  }

  useEffect(() => {
    if (!client || !chatId) {
      return;
    }
    const activeClient = client;
    const activeChatId = chatId;
    const controller = new AbortController();
    const { signal } = controller;

    async function pollNotifications(
      apiClient: GreenApiClient,
      activeConversationId: string,
    ) {
      let backoffMs = 1_000;
      while (!signal.aborted) {
        try {
          const notification = await apiClient.receiveNotification(signal);
          if (!notification) {
            setPolling("listening");
            backoffMs = 1_000;
            await waitFor(300, signal);
            continue;
          }

          const body = notification.body;
          const messageText = body.messageData?.textMessageData?.textMessage;
          const messageChatId = body.senderData?.chatId;
          if (
            body.typeWebhook === "incomingMessageReceived" &&
            body.messageData?.typeMessage === "textMessage" &&
            messageChatId === activeConversationId &&
            typeof messageText === "string" &&
            messageText.length > 0
          ) {
            const messageId = body.idMessage ?? `receipt-${notification.receiptId}`;
            if (!processedMessageIds.current.has(messageId)) {
              processedMessageIds.current.add(messageId);
              setMessages((current) => [...current, {
                id: messageId,
                text: messageText,
                direction: "incoming",
                sentAt: typeof body.timestamp === "number" ? body.timestamp * 1000 : Date.now(),
                status: "accepted",
              }]);
            }
          }

          const acknowledgement = await apiClient.deleteNotification(notification.receiptId);
          if (!acknowledgement.result) {
            throw new GreenApiError("Не удалось подтвердить получение уведомления.", "response");
          }
          setPolling("listening");
          setPollingError(null);
          backoffMs = 1_000;
        } catch (error) {
          if (signal.aborted || isAbortError(error)) {
            break;
          }
          setPolling("retrying");
          setPollingError(errorMessage(error));
          await waitFor(backoffMs, signal);
          backoffMs = Math.min(backoffMs * 2, 30_000);
        }
      }
    }

    void pollNotifications(activeClient, activeChatId);
    return () => controller.abort();
  }, [client, chatId]);

  function handleLogout() {
    setClient(null);
    setChat(null);
    setMessages([]);
    setDialogOpen(false);
    setDialogError(null);
    setPolling("idle");
    setPollingError(null);
    setMobileChatOpen(false);
    processedMessageIds.current.clear();
  }

  if (!client) {
    return <ConnectionForm onConnect={handleConnect} />;
  }

  return (
    <ChatWorkspace
      chat={chat}
      messages={messages}
      theme={theme}
      polling={polling}
      pollingError={pollingError}
      dialogOpen={dialogOpen}
      checkingNumber={checkingNumber}
      dialogError={dialogError}
      sending={sendingCount > 0}
      mobileChatOpen={mobileChatOpen}
      onCreateChat={handleCreateChat}
      onOpenDialog={() => {
        setDialogError(null);
        setDialogOpen(true);
      }}
      onCloseDialog={() => setDialogOpen(false)}
      onSendMessage={(text) => void sendMessage(text)}
      onRetryMessage={(message) => void sendMessage(message.text, message.id)}
      onToggleTheme={() => setTheme((current) => current === "light" ? "dark" : "light")}
      onLogout={handleLogout}
      onMobileBack={() => setMobileChatOpen(false)}
      onSelectChat={() => setMobileChatOpen(true)}
    />
  );
}