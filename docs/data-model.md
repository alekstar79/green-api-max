# Модель данных

Поля GREEN-API ниже приведены только по подтвержденной документации. Поля UI являются внутренней моделью приложения.

## Сущности

| Сущность     | Поля                                                       | Состояния / проверки                                                                                     | Связи                           |
| ------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Credentials  | `idInstance`, `apiTokenInstance`                           | Только память сессии; оба обязательны.                                                                   | Используется API-клиентом.      |
| Chat         | `chatId`, `phoneNumber`, `title`                           | Создается после успешного `CheckAccount`; `chatId` приходит строкой.                                     | Содержит сообщения.             |
| Message      | `id`, `chatId`, `text`, `direction`, `timestamp`, `status` | Текст непустой; отправляемый текст до 4000 символов. Статус отправки не равен доставке.                  | Принадлежит чату.               |
| Notification | `receiptId`, `body`                                        | `receiptId` подтверждается через `DeleteNotification`; обрабатывается только входящее текстовое событие. | Может создать входящее Message. |

## Подтвержденные поля интеграции

- `CheckAccount` принимает `phoneNumber` (integer); ответ может содержать `exist`, `chatId`, `fromCache` [SRC-005].
- `SendMessage` принимает `chatId` и `message`; ответ содержит `idMessage` [SRC-004].
- `ReceiveNotification` возвращает `receiptId` и `body` [SRC-007].
- Входящий текст: `body.typeWebhook = incomingMessageReceived`, `body.senderData.chatId`, `body.messageData.typeMessage = textMessage`, `body.messageData.textMessageData.textMessage` [SRC-009].
- `DeleteNotification` возвращает `result` и `reason`; успешное удаление обозначается `result: true` [SRC-008].

## Переходы

```text
Chat: absent -> checking -> ready | not-found | failed
Message: composing -> sending -> accepted | failed
Notification: received -> parsed -> displayed-if-supported -> acknowledged
```

Схема намеренно не моделирует статусы доставки: `SendMessage` подтверждает постановку сообщения в очередь, а не доставку получателю [SRC-004].
