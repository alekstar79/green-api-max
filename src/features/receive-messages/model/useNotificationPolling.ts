import { useEffect, useReducer, useRef } from "react";
import type { ChatMessage } from "@/entities/message";
import type { Notification } from "@/entities/notification";
import {
  GreenApiError,
  isAbortError,
  errorMessage,
  type GreenApiClient,
} from "@/shared/api/green-api";
import { waitFor } from "@/shared/lib/abortable-wait/wait";
import { initialPollingState, pollingReducer } from "./pollingReducer";

function toChatMessage(notification: Notification, chatId: string): ChatMessage | null {
  const body = notification.body;
  const text = body.messageData?.textMessageData?.textMessage;
  if (
    body.typeWebhook !== "incomingMessageReceived" ||
    body.messageData?.typeMessage !== "textMessage" ||
    body.senderData?.chatId !== chatId ||
    typeof text !== "string" ||
    text.length === 0
  ) {
    return null;
  }

  return {
    id: body.idMessage ?? `receipt-${notification.receiptId}`,
    chatId,
    text,
    direction: "incoming",
    sentAt: typeof body.timestamp === "number" ? body.timestamp * 1000 : Date.now(),
    status: "accepted",
  };
}

export function useNotificationPolling(
  client: GreenApiClient | null,
  chatId: string | null,
  onIncoming: (message: ChatMessage) => void,
) {
  const [state, dispatch] = useReducer(pollingReducer, initialPollingState);
  // Callback changes should not tear down a long-poll request or reset its backoff.
  const onIncomingRef = useRef(onIncoming);
  // Deduplication state must survive renders without triggering another polling cycle.
  const processedMessageIds = useRef(new Set<string>());

  useEffect(() => {
    onIncomingRef.current = onIncoming;
  }, [onIncoming]);

  useEffect(() => {
    if (!client || !chatId) return;

    const activeClient = client;
    const activeChatId = chatId;
    const controller = new AbortController();
    const { signal } = controller;
    processedMessageIds.current.clear();

    async function poll() {
      let backoffMs = 1_000;
      while (!signal.aborted) {
        try {
          const notification = await activeClient.receiveNotification(signal);
          if (!notification) {
            dispatch({ type: "listening", chatId: activeChatId });
            backoffMs = 1_000;
            await waitFor(300, signal);
            continue;
          }

          const message = toChatMessage(notification, activeChatId);
          if (message && !processedMessageIds.current.has(message.id)) {
            onIncomingRef.current(message);
            processedMessageIds.current.add(message.id);
          }

          // Persist the incoming message before acknowledging so an ack retry cannot append it twice.
          const acknowledgement = await activeClient.deleteNotification(notification.receiptId);
          if (!acknowledgement.result) {
            throw new GreenApiError("Не удалось подтвердить получение уведомления.", "response");
          }
          dispatch({ type: "listening", chatId: activeChatId });
          backoffMs = 1_000;
        } catch (error) {
          if (signal.aborted || isAbortError(error)) break;
          dispatch({
            type: "retrying",
            chatId: activeChatId,
            error: errorMessage(error),
          });
          await waitFor(backoffMs, signal);
          backoffMs = Math.min(backoffMs * 2, 30_000);
        }
      }
    }

    void poll();
    return () => controller.abort();
  }, [client, chatId]);

  if (!client || !chatId) {
    return { status: "idle" as const, error: null };
  }
  if (state.chatId !== chatId) {
    return { status: "listening" as const, error: null };
  }
  return { status: state.status, error: state.error };
}