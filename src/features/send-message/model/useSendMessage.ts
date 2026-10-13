import { useCallback, useState } from "react";
import type { ChatMessage } from "@/entities/message";
import type { GreenApiClient } from "@/shared/api/green-api";

interface MessageActions {
  addOutgoing: (message: ChatMessage) => void;
  confirmSent: (localId: string, serverId: string) => void;
  markFailed: (localId: string) => void;
}

export function useSendMessage(
  client: GreenApiClient | null,
  chatId: string | null,
  actions: MessageActions,
) {
  const [sendingCount, setSendingCount] = useState(0);
  const sending = sendingCount > 0;

  const { addOutgoing, confirmSent, markFailed } = actions;

  const sendMessage = useCallback(async (text: string, existingId?: string): Promise<void> => {
    const messageText = text.trim();
    if (!client || !chatId || !messageText || Array.from(messageText).length > 4000) {
      return;
    }

    const id = existingId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const message: ChatMessage = {
      id,
      chatId,
      text: messageText,
      direction: "outgoing",
      sentAt: Date.now(),
      status: "sending",
    };
    setSendingCount((count) => count + 1);
    addOutgoing(message);
    try {
      const response = await client.sendMessage(chatId, messageText);
      confirmSent(id, response.idMessage);
    } catch {
      markFailed(id);
    } finally {
      setSendingCount((count) => Math.max(0, count - 1));
    }
  }, [addOutgoing, chatId, client, confirmSent, markFailed]);

  const retryMessage = useCallback((message: ChatMessage) => {
    if (message.status === "failed") {
      return sendMessage(message.text, message.id);
    }
    return Promise.resolve();
  }, [sendMessage]);

  return { sendMessage, retryMessage, sending };
}