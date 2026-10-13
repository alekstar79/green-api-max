import { describe, expect, it, vi } from "vitest";
import {
    createGreenApiClient,
    GreenApiError,
    resolveApiBaseUrl,
    type Credentials,
} from "./greenApi";

const credentials: Credentials = {
    idInstance: "3000000001",
    apiTokenInstance: "test-token",
};

function jsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

describe("GREEN-API client", () => {
    it("uses the configured host and falls back when it is absent or blank", () => {
        expect(resolveApiBaseUrl("https://3100.api.green-api.com/")).toBe(
            "https://3100.api.green-api.com",
        );
        expect(resolveApiBaseUrl("")).toBe("https://api.green-api.com/v3");
        expect(resolveApiBaseUrl()).toBe("https://api.green-api.com/v3");
    });

    it("checks a phone number and returns the chat ID", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
            jsonResponse({ exist: true, chatId: "10000000", fromCache: false }),
        );
        const client = createGreenApiClient(credentials, {
            apiBaseUrl: "https://api.example.test/v3/",
            fetcher,
        });

        await expect(client.checkAccount(79991234567)).resolves.toEqual({
            exist: true,
            chatId: "10000000",
            fromCache: false,
        });
        expect(fetcher).toHaveBeenCalledWith(
            "https://api.example.test/v3/waInstance3000000001/checkAccount/test-token",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ phoneNumber: 79991234567 }),
            }),
        );
    });

    it("sends text and returns idMessage", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
            jsonResponse({ idMessage: "message-1" }),
        );
        const client = createGreenApiClient(credentials, { fetcher });

        await expect(client.sendMessage("10000000", "Привет")).resolves.toEqual({
            idMessage: "message-1",
        });
        expect(fetcher).toHaveBeenCalledWith(
            expect.stringContaining("/sendMessage/test-token"),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ chatId: "10000000", message: "Привет" }),
            }),
        );
    });

    it("returns null for an empty long-poll response", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
        const client = createGreenApiClient(credentials, { fetcher });

        await expect(client.receiveNotification(new AbortController().signal)).resolves.toBeNull();
        expect(fetcher).toHaveBeenCalledWith(
            expect.stringContaining("receiveTimeout=5"),
            expect.objectContaining({ method: "GET" }),
        );
    });

    it("receives a notification with a receipt ID", async () => {
        const notification = {
            receiptId: 42,
            body: { typeWebhook: "incomingMessageReceived" },
        };
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(notification));
        const client = createGreenApiClient(credentials, { fetcher });

        await expect(client.receiveNotification(new AbortController().signal)).resolves.toEqual(
            notification,
        );
    });

    it("deletes a processed notification", async () => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
            jsonResponse({ result: true, reason: "" }),
        );
        const client = createGreenApiClient(credentials, { fetcher });

        await expect(client.deleteNotification(42)).resolves.toEqual({ result: true, reason: "" });
        expect(fetcher).toHaveBeenCalledWith(
            expect.stringContaining("/deleteNotification/test-token/42"),
            expect.objectContaining({ method: "DELETE" }),
        );
    });

    it.each([400, 500])("maps HTTP %i responses to a safe API error", async (status) => {
        const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ reason: "failed" }, status));
        const client = createGreenApiClient(credentials, { fetcher });

        await expect(client.sendMessage("10000000", "Привет")).rejects.toMatchObject({
            kind: "http",
            status,
        });
    });

    it("maps a request timeout", async () => {
        const fetcher = vi.fn<typeof fetch>((_input, init) => new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
                reject(new DOMException("Aborted", "AbortError"));
            });
        }));
        const client = createGreenApiClient(credentials, { fetcher, timeoutMs: 5 });

        await expect(client.sendMessage("10000000", "Привет")).rejects.toMatchObject({
            kind: "timeout",
        });
    });

    it("maps a network failure without exposing credentials", async () => {
        const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("network failed"));
        const client = createGreenApiClient(credentials, { fetcher });

        await expect(client.sendMessage("10000000", "Привет")).rejects.toBeInstanceOf(GreenApiError);
        await expect(client.sendMessage("10000000", "Привет")).rejects.not.toThrow("test-token");
    });

    it("rejects receive timeout values outside the documented range", async () => {
        const fetcher = vi.fn<typeof fetch>();
        const client = createGreenApiClient(credentials, { fetcher });

        await expect(client.receiveNotification(new AbortController().signal, 4)).rejects.toThrow(
            RangeError,
        );
        expect(fetcher).not.toHaveBeenCalled();
    });
});