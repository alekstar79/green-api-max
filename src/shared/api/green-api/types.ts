export interface CheckAccountResult {
  exist?: boolean;
  chatId?: string;
  fromCache?: boolean;
  status?: false;
  reason?: string;
}

export interface SendMessageResult {
  idMessage: string;
}

export interface IncomingNotificationBody {
  typeWebhook?: string;
  timestamp?: number;
  idMessage?: string;
  senderData?: {
    chatId?: string;
  };
  messageData?: {
    typeMessage?: string;
    textMessageData?: {
      textMessage?: string;
    };
  };
}

export interface IncomingNotification {
  receiptId: number;
  body: IncomingNotificationBody;
}

export interface DeleteNotificationResult {
  result: boolean;
  reason: string;
}

export interface GreenApiClientOptions {
  fetcher?: typeof fetch;
  timeoutMs?: number;
}