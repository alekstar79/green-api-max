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

export function errorMessage(error: unknown): string {
  return error instanceof GreenApiError
    ? error.message
    : "Не удалось завершить запрос. Проверьте сеть и попробуйте ещё раз.";
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}