import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCredentials } from "@/features/connect-instance";

describe("useCredentials", () => {
  it("creates a client for valid credentials and resets it", () => {
    const { result } = renderHook(() => useCredentials());
    expect(result.current.client).toBeNull();

    act(() => {
      expect(result.current.connect({ idInstance: "3000000001", apiTokenInstance: "token" })).toBe(true);
    });
    expect(result.current.client).not.toBeNull();

    act(() => result.current.reset());
    expect(result.current.client).toBeNull();
  });

  it("rejects missing or invalid credentials without creating a client", () => {
    const { result } = renderHook(() => useCredentials());

    act(() => {
      expect(result.current.connect({ idInstance: "bad-id", apiTokenInstance: "" })).toBe(false);
    });
    expect(result.current.client).toBeNull();
    expect(result.current.error).toContain("Проверьте ID инстанса");
  });
});