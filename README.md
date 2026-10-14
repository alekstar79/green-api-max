# MAX Text Chat via GREEN-API

Минимальный React-интерфейс для отправки и получения текстовых сообщений в MAX через GREEN-API.

## Технологии

- React 19, TypeScript 6, Vite 8
- GREEN-API HTTP API
- Vitest и React Testing Library

## Требования

- Node.js 24 или совместимая актуальная версия
- npm 11
- Доступ к GREEN-API instance и зарегистрированному аккаунту MAX

## Локальный запуск

```sh
npm install
npm run dev
```

Vite покажет локальный адрес приложения. Введите `idInstance` и `apiTokenInstance` в форме подключения. Приложение хранит их только в памяти вкладки.

## Настройка API host

В `.env.local` задается `VITE_API_URL`. Для этого checkout используется host инстанса из кабинета. Если переменная не задана, приложение использует `https://api.green-api.com/v3`. Пустое шаблонное значение тоже переключает приложение на fallback.

`ID_INSTANCE` и `API_TOKEN_INSTANCE` из `.env.local` не читаются приложением. Они предназначены только для локальных smoke checks из терминала. Реальные значения нельзя коммитить. Файл `.env.local` игнорируется Git.

`.env.example` содержит только пустые шаблонные значения. Не заменяйте существующий `.env.local` копией шаблона.

## Настройка получения сообщений

Для HTTP API GREEN-API у инстанса должен быть пустой `webhookUrl` и включен `incomingWebhook`. Подробности и поля методов перечислены в [API integration catalog](docs/api-integration.md).

## Команды

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

## Ограничения

- История хранится в памяти вкладки и не загружается из журнала GREEN-API.
- В одном окне открыт один диалог.
- Отображаются только входящие текстовые уведомления; прочие типы подтверждаются и не показываются.
- Ответ `SendMessage` трактуется как принятие API, а не гарантия доставки.
- Полный end-to-end цикл проверен вручную: отправка через SendMessage доставляется в MAX, ответ от второго аккаунта приходит через ReceiveNotification, подтверждение через DeleteNotification возвращает result=true.
- Веб-версия MAX для сверки активного экрана требует авторизации; визуальное совпадение активного чата не подтверждено.
- `.env.local` задан для локального кластера; universal fallback CORS/TLS в этом окружении не подтвержден.

## Архитектура и проверяемость

```text
src/
  app/              composition root and application orchestration
  widgets/          chat workspace and message timeline
  features/         connection, chat creation, messaging, polling, theme
  entities/         credentials, chat, message, and notification models
  shared/           GREEN-API client, config, utilities, and UI primitives
tests/              tests mirrored by architectural layer
```

- [Требования](docs/requirements.md)
- [Сценарии](docs/scenarios.md)
- [Модель данных](docs/data-model.md)
- [Матрица traceability](docs/traceability.md)
- [Допущения и риски](docs/assumptions-and-risks.md)
- [Source Register](docs/source-register.md)
- [Architecture decisions](docs/architecture-decisions.md)
- [Design rationale](docs/design-rationale.md)

Папка проекта не инициализирована как Git repository; remote, GitHub и deployment намеренно не создавались.
