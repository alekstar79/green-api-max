import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function connect(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("ID инстанса"), "3000000001");
  await user.type(screen.getByLabelText("Токен API"), "runtime-token");
  await user.click(screen.getByRole("button", { name: "Подключиться" }));
}

async function createChat(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(screen.getByRole("complementary", { name: "Список чатов" }))
    .getByRole("button", { name: "Начать новый чат" }));
  await user.type(screen.getByLabelText("Номер телефона"), "+7 (999) 123-45-67");
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Создать чат" }));
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("chat application", () => {
  it("validates a new chat number without making a request", async () => {
    const user = userEvent.setup();
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);
    render(<App />);
    await connect(user);

    await user.click(within(screen.getByRole("complementary", { name: "Список чатов" }))
      .getByRole("button", { name: "Начать новый чат" }));
    await user.type(screen.getByLabelText("Номер телефона"), "12345");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Создать чат" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Укажите номер РФ или Беларуси");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("checks the phone, creates the chat, and sends text", async () => {
    const user = userEvent.setup();
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("checkAccount")) {
        return jsonResponse({ exist: true, chatId: "10000000", fromCache: false });
      }
      if (url.includes("sendMessage")) {
        return jsonResponse({ idMessage: "out-1" });
      }
      if (url.includes("receiveNotification")) {
        return new Response(null, { status: 200 });
      }
      throw new Error("Unexpected API route");
    });
    vi.stubGlobal("fetch", fetcher);
    render(<App />);
    await connect(user);
    await createChat(user);

    expect(await screen.findByRole("heading", { name: "79991234567" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Написать сообщение" }), "Привет!");
    await user.keyboard("{Enter}");

    expect(await screen.findByText("Принято API")).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("/sendMessage/runtime-token"),
      expect.objectContaining({ body: JSON.stringify({ chatId: "10000000", message: "Привет!" }) }),
    );
  });

  it("displays an incoming text and acknowledges its receipt", async () => {
    const user = userEvent.setup();
    let notificationPending = true;
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("checkAccount")) {
        return jsonResponse({ exist: true, chatId: "10000000", fromCache: false });
      }
      if (url.includes("receiveNotification") && notificationPending) {
        notificationPending = false;
        return jsonResponse({
          receiptId: 77,
          body: {
            typeWebhook: "incomingMessageReceived",
            timestamp: 1760000000,
            idMessage: "in-1",
            senderData: { chatId: "10000000" },
            messageData: {
              typeMessage: "textMessage",
              textMessageData: { textMessage: "Ответ собеседника" },
            },
          },
        });
      }
      if (url.includes("deleteNotification")) {
        return jsonResponse({ result: true, reason: "" });
      }
      if (url.includes("receiveNotification")) {
        return new Response(null, { status: 200 });
      }
      throw new Error("Unexpected API route");
    });
    vi.stubGlobal("fetch", fetcher);
    render(<App />);
    await connect(user);
    await createChat(user);

    expect(await within(screen.getByRole("log", { name: "История сообщений" }))
      .findByText("Ответ собеседника")).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("/deleteNotification/runtime-token/77"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("reports a network failure while checking the recipient", async () => {
    const user = userEvent.setup();
    const fetcher = vi.fn<typeof fetch>()
      .mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetcher);
    render(<App />);
    await connect(user);
    await createChat(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось связаться с GREEN-API");
  });

  it("acknowledges but does not render non-text notifications", async () => {
    const user = userEvent.setup();
    let notificationPending = true;
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("checkAccount")) {
        return jsonResponse({ exist: true, chatId: "10000000", fromCache: false });
      }
      if (url.includes("receiveNotification") && notificationPending) {
        notificationPending = false;
        return jsonResponse({
          receiptId: 78,
          body: {
            typeWebhook: "incomingMessageReceived",
            idMessage: "media-1",
            senderData: { chatId: "10000000" },
            messageData: { typeMessage: "imageMessage" },
          },
        });
      }
      if (url.includes("deleteNotification")) {
        return jsonResponse({ result: true, reason: "" });
      }
      if (url.includes("receiveNotification")) {
        return new Response(null, { status: 200 });
      }
      throw new Error("Unexpected API route");
    });
    vi.stubGlobal("fetch", fetcher);
    render(<App />);
    await connect(user);
    await createChat(user);

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(
        expect.stringContaining("/deleteNotification/runtime-token/78"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(within(screen.getByRole("log", { name: "История сообщений" }))
      .queryByText("Изображение")).not.toBeInTheDocument();
  });

  it("toggles the theme and returns to the connection form on logout", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>());
    render(<App />);
    await connect(user);

    await user.click(screen.getByRole("button", { name: "Включить тёмную тему" }));
    expect(document.querySelector(".chat-app.theme-dark")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Отключиться" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Подключение к MAX" })).toBeInTheDocument();
    });
  });
});