import { ChevronLeft, LogOut, MessageCircle, Moon, Plus, Send, Sun } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { ChatContact, ChatMessage, Theme } from "../types/chat";
import { NewChatDialog } from "./NewChatDialog";
import { MessageTimeline } from "./MessageTimeline";

interface ChatWorkspaceProps {
  chat: ChatContact | null;
  messages: ChatMessage[];
  theme: Theme;
  polling: "idle" | "listening" | "retrying";
  pollingError: string | null;
  dialogOpen: boolean;
  checkingNumber: boolean;
  dialogError: string | null;
  sending: boolean;
  onCreateChat: (phoneNumber: string) => Promise<boolean>;
  onOpenDialog: () => void;
  onCloseDialog: () => void;
  onSendMessage: (text: string) => void;
  onRetryMessage: (message: ChatMessage) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onMobileBack: () => void;
  onSelectChat: () => void;
  mobileChatOpen: boolean;
}

export function ChatWorkspace({
  chat,
  messages,
  theme,
  polling,
  pollingError,
  dialogOpen,
  checkingNumber,
  dialogError,
  sending,
  onCreateChat,
  onOpenDialog,
  onCloseDialog,
  onSendMessage,
  onRetryMessage,
  onToggleTheme,
  onLogout,
  onMobileBack,
  onSelectChat,
  mobileChatOpen,
}: ChatWorkspaceProps) {
  const [draft, setDraft] = useState("");
  const characterCount = Array.from(draft).length;
  const latestMessage = messages.at(-1);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || characterCount > 4000 || sending || !chat) {
      return;
    }
    setDraft("");
    onSendMessage(text);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <main className={`chat-app theme-${theme}${mobileChatOpen ? " mobile-chat-open" : ""}`}>
      <header className="app-topbar">
        <div className="wordmark" aria-label="MAX">
          <span>MAX</span>
          <span className="wordmark-divider" aria-hidden="true" />
          <span className="wordmark-caption">GREEN-API</span>
        </div>
        <div className="topbar-actions">
          <span className={`connection-indicator connection-${polling}`}>
            <span aria-hidden="true" />
            {polling === "retrying" ? "Переподключение" : chat ? "Получение сообщений" : "Сессия активна"}
          </span>
          <button
            className="icon-button"
            type="button"
            aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
            title={theme === "light" ? "Тёмная тема" : "Светлая тема"}
            onClick={onToggleTheme}
          >
            {theme === "light" ? <Moon size={19} aria-hidden="true" /> : <Sun size={19} aria-hidden="true" />}
          </button>
          <button
            className="icon-button logout-button"
            type="button"
            aria-label="Отключиться"
            title="Отключиться"
            onClick={onLogout}
          >
            <LogOut size={19} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="chat-layout">
        <aside className="chat-sidebar" aria-label="Список чатов">
          <div className="sidebar-heading">
            <h1>Чаты</h1>
            <button
              className="icon-button create-chat-button"
              type="button"
              aria-label="Начать новый чат"
              title="Начать новый чат"
              onClick={onOpenDialog}
            >
              <Plus size={20} aria-hidden="true" />
            </button>
          </div>
          {chat ? (
            <button className="chat-list-item is-selected" type="button" onClick={onSelectChat}>
              <span className="contact-placeholder" aria-hidden="true">
                <MessageCircle size={21} />
              </span>
              <span className="chat-list-copy">
                <span className="chat-list-title">{chat.phoneNumber}</span>
                <span className="chat-list-preview">{latestMessage?.text ?? "Новая переписка"}</span>
              </span>
              <span className="chat-list-meta">MAX</span>
            </button>
          ) : (
            <div className="sidebar-empty">
              <p>Здесь появятся ваши диалоги.</p>
              <button className="text-action" type="button" onClick={onOpenDialog}>
                Создать чат
              </button>
            </div>
          )}
          <div className="sidebar-bottom">
            <span className="api-session-label">Подключение GREEN-API</span>
          </div>
        </aside>

        <section className="conversation-panel" aria-label="Переписка">
          {chat ? (
            <>
              <header className="conversation-header">
                <button
                  className="icon-button mobile-back-button"
                  type="button"
                  aria-label="Назад к чатам"
                  onClick={onMobileBack}
                >
                  <ChevronLeft size={21} aria-hidden="true" />
                </button>
                <span className="contact-placeholder header-contact-placeholder" aria-hidden="true">
                  <MessageCircle size={19} />
                </span>
                <div className="conversation-title">
                  <h2>{chat.phoneNumber}</h2>
                  <span>{pollingError ?? (polling === "retrying" ? "Ожидаем соединение" : "Личный чат")}</span>
                </div>
              </header>
              {pollingError && <p className="inline-error" role="status">{pollingError}</p>}
              <MessageTimeline messages={messages} onRetry={onRetryMessage} />
              <form className="composer" onSubmit={handleSubmit}>
                <label className="visually-hidden" htmlFor="message-draft">Написать сообщение</label>
                <textarea
                  id="message-draft"
                  value={draft}
                  rows={1}
                  placeholder="Написать сообщение"
                  aria-label="Написать сообщение"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                />
                {characterCount > 3600 && (
                  <span className={`character-count${characterCount > 4000 ? " is-over-limit" : ""}`}>
                    {characterCount}/4000
                  </span>
                )}
                <button
                  className="send-button"
                  type="submit"
                  aria-label="Отправить сообщение"
                  title="Отправить сообщение"
                  disabled={!draft.trim() || characterCount > 4000 || sending}
                >
                  <Send size={19} aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <div className="conversation-empty">
              <span className="empty-message-mark" aria-hidden="true">
                <MessageCircle size={31} />
              </span>
              <h2>Выберите собеседника</h2>
              <p>Создайте чат по номеру телефона, чтобы отправить текстовое сообщение.</p>
              <button className="primary-button empty-create-button" type="button" onClick={onOpenDialog}>
                Создать чат
              </button>
            </div>
          )}
        </section>
      </div>

      {dialogOpen && (
        <NewChatDialog
          busy={checkingNumber}
          error={dialogError}
          onClose={onCloseDialog}
          onCreate={onCreateChat}
        />
      )}
    </main>
  );
}