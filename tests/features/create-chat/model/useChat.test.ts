import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GreenApiError, type GreenApiClient } from "@/shared/api/green-api";
import { useChat } from "@/features/create-chat";

function clientWith(checkAccount: GreenApiClient["checkAccount"]): GreenApiClient {
  return { checkAccount } as unknown as GreenApiClient;
}

describe("useChat", () => {
  it("validates the number before calling CheckAccount", async () => {
    const checkAccount = vi.fn<GreenApiClient["checkAccount"]>();
    const { result } = renderHook(() => useChat(clientWith(checkAccount)));

    await act(async () => {
      expect(await result.current.createChat("12345")).toBe(false);
    });
    expect(result.current.dialogError).toContain("Укажите номер РФ или Беларуси");
    expect(checkAccount).not.toHaveBeenCalled();
  });

  it("creates a chat from the returned chatId", async () => {
    const checkAccount = vi.fn<GreenApiClient["checkAccount"]>().mockResolvedValue({
      exist: true,
      chatId: "10000000",
      fromCache: false,
    });
    const { result } = renderHook(() => useChat(clientWith(checkAccount)));

    await act(async () => {
      expect(await result.current.createChat("+7 (999) 123-45-67")).toBe(true);
    });
    expect(checkAccount).toHaveBeenCalledWith(79991234567);
    expect(result.current.chat).toEqual({ chatId: "10000000", phoneNumber: "79991234567" });
    expect(result.current.dialogError).toBeNull();
  });

  it("reports missing account and API errors", async () => {
    const checkAccount = vi.fn<GreenApiClient["checkAccount"]>().mockResolvedValue({
      exist: false,
      chatId: "",
      fromCache: true,
    });
    const { result, rerender } = renderHook(({ apiClient }) => useChat(apiClient), {
      initialProps: { apiClient: clientWith(checkAccount) },
    });

    await act(async () => {
      expect(await result.current.createChat("79991234567")).toBe(false);
    });
    expect(result.current.dialogError).toContain("не найден аккаунт MAX");

    const failingClient = clientWith(vi.fn<GreenApiClient["checkAccount"]>().mockRejectedValue(
      new GreenApiError("API unavailable", "http", 503),
    ));
    rerender({ apiClient: failingClient });
    await act(async () => {
      expect(await result.current.createChat("79991234567")).toBe(false);
    });
    await waitFor(() => expect(result.current.dialogError).toContain("API unavailable"));
  });
});