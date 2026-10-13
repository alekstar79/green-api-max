export type MessageDirection = "incoming" | "outgoing";
export type MessageStatus = "sending" | "accepted" | "failed";

export interface ChatMessage {
  id: string;
  chatId: string;
  text: string;
  direction: MessageDirection;
  sentAt: number;
  status: MessageStatus;
}