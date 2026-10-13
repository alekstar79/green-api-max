import { GreenApiError } from "./errors";
import type {
  CheckAccountResult,
  DeleteNotificationResult,
  GreenApiClientOptions,
  IncomingNotification,
  IncomingNotificationBody,
  SendMessageResult,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createGreenApiClient(
  idInstance: string,
  apiTokenInstance: string,
  apiBaseUrl: string,
  options: GreenApiClientOptions = {},
) {
  const baseUrl = apiBaseUrl.replace(/\/+$/, "");
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const token = encodeURIComponent(apiTokenInstance);
  const instance = `/waInstance${encodeURIComponent(idInstance)}`;

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

    // A request-owned signal lets timeout abort this fetch without aborting the caller's shared signal.
    const controller = new AbortController();
    let timedOut = false;
    const abortFromCaller = () => controller.abort(callerSignal?.reason);
    callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, requestTimeoutMs);

    try {
      let response: Response;
      // Keep transport failures separate so response parsing and HTTP validation retain precise errors.
      try {
        response = await fetcher(`${baseUrl}${path}`, {
          method,
          headers: body === undefined ? undefined : { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        if (callerSignal?.aborted) {
          throw error;
        }
        if (timedOut) {
          throw new GreenApiError("Истекло время ожидания ответа GREEN-API.", "timeout");
        }
        throw new GreenApiError("Не удалось связаться с GREEN-API.", "network");
      }

      const responseText = await response.text();
      let responseData: unknown;
      let invalidJson = false;
      if (responseText.trim()) {
        try {
          responseData = JSON.parse(responseText) as unknown;
        } catch {
          invalidJson = true;
        }
      }

      if (invalidJson) {
        throw new GreenApiError("GREEN-API вернул некорректный ответ.", "response");
      }
      if (!response.ok) {
        throw new GreenApiError(
          `Запрос к GREEN-API завершился с ошибкой (${response.status}).`,
          "http",
          response.status,
        );
      }

      return (responseData ?? null) as T | null;
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