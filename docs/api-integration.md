# GREEN-API Integration Catalog

Дата сверки документации: 2026-10-13. Все пути ниже строятся от `VITE_API_URL`.

## Host и credentials

- Приоритетный host приложения: `import.meta.env.VITE_API_URL`; fallback: `https://api.green-api.com/v3`.
- `idInstance` и `apiTokenInstance` пользователь вводит в интерфейсе. GREEN-API передает оба значения в URL path согласно контрактам ниже [SRC-002, SRC-003].
- Vite публикует клиентскому коду переменные с префиксом `VITE_`; поэтому runtime credentials не хранятся в env приложения [SRC-014].
- API-клиент не пишет URL, token, request body или ответ сервиса в console.

## Интерфейсы

| Interface           | Request                                                                               | Request data                                      | Successful response                                                                | Source    |
| ------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------- | --------- |
| CheckAccount        | `POST /waInstance{idInstance}/checkAccount/{apiTokenInstance}`                        | JSON `{ "phoneNumber": 79991234567 }`             | `{ "exist": true, "chatId": "10000000", "fromCache": false }`                      | [SRC-005] |
| SendMessage         | `POST /waInstance{idInstance}/sendMessage/{apiTokenInstance}`                         | JSON `{ "chatId": "10000000", "message": "..." }` | `{ "idMessage": "..." }`                                                           | [SRC-004] |
| ReceiveNotification | `GET /waInstance{idInstance}/receiveNotification/{apiTokenInstance}?receiveTimeout=5` | `receiveTimeout`: integer 5–60 seconds, default 5 | Empty body on receive timeout, otherwise `{ "receiptId": number, "body": object }` | [SRC-007] |
| DeleteNotification  | `DELETE /waInstance{idInstance}/deleteNotification/{apiTokenInstance}/{receiptId}`    | Receipt from ReceiveNotification                  | `{ "result": boolean, "reason": string }`                                          | [SRC-008] |

GREEN-API allows the `/v3/` path prefix to be omitted or included; the selected base URL determines whether it is already present [SRC-003]. `VITE_API_URL` is normalized for a trailing slash.

## Incoming text filter

An event is rendered only if `body.typeWebhook` is `incomingMessageReceived`, `body.messageData.typeMessage` is `textMessage`, and `body.senderData.chatId` matches the active chat. Text comes from `body.messageData.textMessageData.textMessage` [SRC-009]. Other notifications are acknowledged so that the FIFO queue can advance, but are not rendered [SRC-006].

Processing order: parse and append supported text in memory, call DeleteNotification with `receiptId`, then continue polling. Repeated message IDs are deduplicated in the current session.

## Instance prerequisites

For HTTP receiving, `webhookUrl` must be empty and `incomingWebhook` enabled [SRC-006]. `CheckAccount` accepts 11/12 digit international numbers for supported РФ/РБ prefixes and returns the `chatId` used by subsequent requests [SRC-005, SRC-010].

## Error handling

| Condition                                           | Client behavior                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Empty or invalid phone                              | Local validation; no request.                                                              |
| `CheckAccount.exist: false`                         | Keep dialog open and show that no MAX account was found.                                   |
| HTTP non-2xx                                        | Show a generic status-bearing error; do not render raw response bodies or URL credentials. |
| Network failure or timeout                          | Show a safe generic error. Polling retries with exponential delay capped at 30 seconds.    |
| Empty long-poll response                            | Continue polling without adding a message.                                                 |
| Notification is not text or belongs to another chat | Do not render; acknowledge receipt.                                                        |
| `DeleteNotification.result: false`                  | Treat as unacknowledged and retry receiving.                                               |
| `SendMessage` success                               | Mark as accepted by GREEN-API, not delivered; allow manual retry after failure.            |

Source-specific limits include `message` length up to 4000 characters [SRC-004] and `receiveTimeout` from 5 to 60 seconds [SRC-007].

## Rate limits

GREEN-API rate limits are applied per instance. Requests exceeding the per-second limit are rejected with HTTP 429 [SRC-016].

| Method              | Maximum requests per second per instance |
| ------------------- | ---------------------------------------: |
| CheckAccount        |                                       10 |
| SendMessage         |                                       50 |
| ReceiveNotification |                                      100 |
| DeleteNotification  |                                      100 |

## Verification

- API methods are unit-tested with mocked `fetch` for success, 4xx, 5xx, timeout, network failure, empty polling, and acknowledgement.
- Browser CORS preflight to the host in `.env.local` returned HTTP 204 and `Access-Control-Allow-Origin: *` on 2026-10-13. This is an environment check, not an API guarantee.
- The universal fallback could not be verified from this environment due to TLS handshake failure. No live message was sent because no test recipient was specified.
