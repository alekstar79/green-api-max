import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMessages } from "@/entities/message";
import type { GreenApiClient } from "@/shared/api/green-api";
import { useSendMessage } from "@/features/send-message";

function renderSendMessage(sendMessage: GreenApiClient["sendMessage"]) {
  const client = { sendMessage } as unknown as GreenApiClient;
  return renderHook(() => {
    const messageState = useMessages();
    const sender = useSendMessage(client, "10000000", messageState);
    return { ...messageState, ...sender };
  });
}

describe("useSendMessage", () => {
  it("sends text and marks the message accepted by API", async () => {
    const sendMessage = vi.fn<GreenApiClient["sendMessage"]>().mockResolvedValue({ idMessage: "out-1" });
    const { result } = renderSendMessage(sendMessage);

    await act(async () => result.current.sendMessage("Hello"));
    expect(sendMessage).toHaveBeenCalledWith("10000000", "Hello");
    expect(result.current.messages[0]).toMatchObject({ id: "out-1", status: "accepted", text: "Hello" });
    expect(result.current.sending).toBe(false);
  });

  it("records failure and retries the same message", async () => {
    const sendMessage = vi.fn<GreenApiClient["sendMessage"]>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ idMessage: "out-2" });
    const { result } = renderSendMessage(sendMessage);

    await act(async () => result.current.sendMessage("Retry me"));
    const failedMessage = result.current.messages[0];
    expect(failedMessage.status).toBe("failed");
    await act(async () => result.current.retryMessage(failedMessage));

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(result.current.messages[0]).toMatchObject({ id: "out-2", status: "accepted" });
  });

  it("does not send empty, over-limit, or chatless text", async () => {
    const sendMessage = vi.fn<GreenApiClient["sendMessage"]>();
    const client = { sendMessage } as unknown as GreenApiClient;
    const { result } = renderHook(() => {
      const messageState = useMessages();
      const sender = useSendMessage(client, null, messageState);
      return { ...messageState, ...sender };
    });

    await act(async () => {
      await result.current.sendMessage(" ");
      await result.current.sendMessage("x".repeat(4001));
    });
    expect(sendMessage).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });
});