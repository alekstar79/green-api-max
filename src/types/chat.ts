export interface ChatContact {
  chatId: string;
  phoneNumber: string;
}

export type MessageDirection = "incoming" | "outgoing";
export type MessageStatus = "sending" | "accepted" | "failed";

export interface ChatMessage {
  id: string;
  text: string;
  direction: MessageDirection;
  sentAt: number;
  status: MessageStatus;
}

export type Theme = "light" | "dark";