import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConnectionForm } from "./ConnectionForm";

describe("ConnectionForm", () => {
  it("requires both credentials before connecting", async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<ConnectionForm onConnect={onConnect} />);

    await user.click(screen.getByRole("button", { name: "Подключиться" }));
    expect(onConnect).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric instance ID before connecting", async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<ConnectionForm onConnect={onConnect} />);

    await user.type(screen.getByLabelText("ID инстанса"), "instance-id");
    await user.type(screen.getByLabelText("Токен API"), "token");
    await user.click(screen.getByRole("button", { name: "Подключиться" }));

    expect(screen.getByRole("alert")).toHaveTextContent("ID инстанса должен содержать только цифры");
    expect(onConnect).not.toHaveBeenCalled();
  });

  it("submits trimmed credentials without persisting them", async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<ConnectionForm onConnect={onConnect} />);

    await user.type(screen.getByLabelText("ID инстанса"), " 3000000001 ");
    await user.type(screen.getByLabelText("Токен API"), " secret-token ");
    await user.click(screen.getByRole("button", { name: "Подключиться" }));

    expect(onConnect).toHaveBeenCalledWith({
      idInstance: "3000000001",
      apiTokenInstance: "secret-token",
    });
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});