export const DEFAULT_API_BASE_URL = "https://api.green-api.com/v3";

export function resolveApiBaseUrl(configuredUrl?: string): string {
  const apiUrl = configuredUrl ?? DEFAULT_API_BASE_URL;
  return (apiUrl.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

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

export type GreenApiErrorKind = "http" | "network" | "timeout" | "response";

export class GreenApiError extends Error {
  constructor(
    message: string,
    readonly kind: GreenApiErrorKind,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GreenApiError";
  }
}

export interface GreenApiClientOptions {
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function instancePath(credentials: Credentials): string {
  return `/waInstance${encodeURIComponent(credentials.idInstance)}`;
}

export function createGreenApiClient(
  credentials: Credentials,
  options: GreenApiClientOptions = {},
) {
  const baseUrl = resolveApiBaseUrl(options.apiBaseUrl ?? API_BASE_URL);
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const token = encodeURIComponent(credentials.apiTokenInstance);
  const instance = instancePath(credentials);

  async function request<T>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: unknown,
    callerSignal?: AbortSignal,
    requestTimeoutMs = timeoutMs,
  ): Promise<T | null> {
    if (callerSignal?.aborted) {
      throw callerSignal.reason ?? new DOMException("Aborted", "AbortError");
    }

    const controller = new AbortController();
    let timedOut = false;
    const abortFromCaller = () => controller.abort(callerSignal?.reason);
    callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, requestTimeoutMs);

    try {
      const response = await fetcher(`${baseUrl}${path}`, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const responseText = await response.text();
      let responseData: unknown;
      if (responseText.trim()) {
        try {
          responseData = JSON.parse(responseText) as unknown;
        } catch {
          throw new GreenApiError("GREEN-API вернул некорректный ответ.", "response");
        }
      }

      if (!response.ok) {
        throw new GreenApiError(
          `Запрос к GREEN-API завершился с ошибкой (${response.status}).`,
          "http",
          response.status,
        );
      }

      return (responseData ?? null) as T | null;
    } catch (error) {
      if (callerSignal?.aborted) {
        throw error;
      }
      if (timedOut) {
        throw new GreenApiError("Истекло время ожидания ответа GREEN-API.", "timeout");
      }
      if (error instanceof GreenApiError) {
        throw error;
      }
      throw new GreenApiError("Не удалось связаться с GREEN-API.", "network");
    } finally {
      clearTimeout(timeoutId);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    }
  }

  return {
    async checkAccount(phoneNumber: number): Promise<CheckAccountResult> {
      const data = await request<unknown>(
        "POST",
        `${instance}/checkAccount/${token}`,
        { phoneNumber },
      );
      if (
        !isRecord(data) ||
        (typeof data.exist !== "boolean" && data.status !== false) ||
        (data.exist === true && typeof data.chatId !== "string")
      ) {
        throw new GreenApiError("GREEN-API вернул неожиданный ответ CheckAccount.", "response");
      }
      return data as CheckAccountResult;
    },

    async sendMessage(chatId: string, message: string): Promise<SendMessageResult> {
      const data = await request<unknown>(
        "POST",
        `${instance}/sendMessage/${token}`,
        { chatId, message },
      );
      if (!isRecord(data) || typeof data.idMessage !== "string") {
        throw new GreenApiError("GREEN-API вернул неожиданный ответ SendMessage.", "response");
      }
      return { idMessage: data.idMessage };
    },

    async receiveNotification(
      signal: AbortSignal,
      receiveTimeout = 5,
    ): Promise<IncomingNotification | null> {
      if (!Number.isInteger(receiveTimeout) || receiveTimeout < 5 || receiveTimeout > 60) {
        throw new RangeError("receiveTimeout должен быть от 5 до 60 секунд.");
      }
      const data = await request<unknown>(
        "GET",
        `${instance}/receiveNotification/${token}?receiveTimeout=${receiveTimeout}`,
        undefined,
        signal,
        (receiveTimeout + 7) * 1000,
      );
      if (data === null) {
        return null;
      }
      if (!isRecord(data) || typeof data.receiptId !== "number" || !isRecord(data.body)) {
        throw new GreenApiError("GREEN-API вернул неожиданный ответ ReceiveNotification.", "response");
      }
      return {
        receiptId: data.receiptId,
        body: data.body as unknown as IncomingNotificationBody,
      };
    },

    async deleteNotification(receiptId: number): Promise<DeleteNotificationResult> {
      const data = await request<unknown>(
        "DELETE",
        `${instance}/deleteNotification/${token}/${encodeURIComponent(String(receiptId))}`,
      );
      if (!isRecord(data) || typeof data.result !== "boolean") {
        throw new GreenApiError("GREEN-API вернул неожиданный ответ DeleteNotification.", "response");
      }
      return {
        result: data.result,
        reason: typeof data.reason === "string" ? data.reason : "",
      };
    },
  };
}

export type GreenApiClient = ReturnType<typeof createGreenApiClient>;

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}