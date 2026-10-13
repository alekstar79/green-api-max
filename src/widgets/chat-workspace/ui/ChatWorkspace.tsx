import { memo, useState, type SubmitEvent } from "react";
import { ChevronLeft, LogOut, MessageCircle, Moon, Send, Sun } from "lucide-react";
import { useChatContext } from "@/app/model/chat-context";
import { useComposerContext } from "@/app/model/composer-context";
import { useDialogContext } from "@/app/model/dialog-context";
import type { ChatMessage } from "@/entities/message";
import { NewChatDialog } from "@/features/create-chat";
import type { Theme } from "@/features/toggle-theme";
import { classNames } from "@/shared/lib/class-names";
import styles from "./ChatWorkspace.module.css";
import { ChatSidebar } from "./ChatSidebar";
import { MessageTimeline } from "./MessageTimeline";

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export const ChatWorkspace = memo(function ChatWorkspace({
  messages,
  theme,
  onToggleTheme,
  onLogout,
}: ChatWorkspaceProps) {
  // Draft state belongs to the composer shell and stays local rather than widening app/context updates.
  const [draft, setDraft] = useState("");
  const { chat, pollStatus, pollError, onSelectChat, onMobileBack, mobileChatOpen } = useChatContext();
  const { onSendMessage, onRetryMessage, sending } = useComposerContext();
  const { dialogOpen, checkingNumber, dialogError, onCreateChat, onOpenDialog, onCloseDialog } = useDialogContext();
  const characterCount = Array.from(draft).length;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || characterCount > 4000 || sending || !chat) {
      return;
    }
    setDraft("");
    onSendMessage(text);
  }

  return (
    <main className={classNames(styles.app, mobileChatOpen && styles.mobileChatOpen)}>
      <header className={styles.topbar}>
        <div className={styles.wordmark} aria-label="MAX">
          <span>MAX</span>
          <span className={styles.wordmarkDivider} aria-hidden="true" />
          <span className={styles.wordmarkCaption}>GREEN-API</span>
        </div>
        <div className={styles.topbarActions}>
          <span className={classNames(styles.connectionIndicator, pollStatus === "retrying" && styles.retrying)}>
            <span aria-hidden="true" />
            {pollStatus === "retrying" ? "Переподключение" : chat ? "Получение сообщений" : "Сессия активна"}
          </span>
          <button
            className={styles.iconButton}
            type="button"
            aria-label={theme === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
            title={theme === "light" ? "Тёмная тема" : "Светлая тема"}
            onClick={onToggleTheme}
          >
            {theme === "light" ? <Moon size={19} aria-hidden="true" /> : <Sun size={19} aria-hidden="true" />}
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Отключиться"
            title="Отключиться"
            onClick={onLogout}
          >
            <LogOut size={19} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <ChatSidebar
          chat={chat}
          latestMessage={messages.at(-1)}
          onSelectChat={onSelectChat}
          onOpenDialog={onOpenDialog}
        />

        <section className={styles.conversationPanel} aria-label="Переписка">
          {chat ? (
            <>
              <header className={styles.conversationHeader}>
                <button
                  className={`${styles.iconButton} ${styles.mobileBackButton}`}
                  type="button"
                  aria-label="Назад к чатам"
                  onClick={onMobileBack}
                >
                  <ChevronLeft size={21} aria-hidden="true" />
                </button>
                <span className={`${styles.contactPlaceholder} ${styles.headerContactPlaceholder}`} aria-hidden="true">
                  <MessageCircle size={19} />
                </span>
                <div className={styles.conversationTitle}>
                  <h2>{chat.phoneNumber}</h2>
                  <span>{pollError ?? (pollStatus === "retrying" ? "Ожидаем соединение" : "Личный чат")}</span>
                </div>
              </header>
              {pollError && <p className={styles.inlineError} role="status">{pollError}</p>}
              <MessageTimeline messages={messages} onRetry={onRetryMessage} />
              <form className={styles.composer} onSubmit={handleSubmit}>
                <label className="visually-hidden" htmlFor="message-draft">Написать сообщение</label>
                <textarea
                  id="message-draft"
                  value={draft}
                  rows={1}
                  placeholder="Написать сообщение"
                  aria-label="Написать сообщение"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                {characterCount > 3600 && (
                  <span className={classNames(styles.characterCount, characterCount > 4000 && styles.overLimit)}>
                    {characterCount}/4000
                  </span>
                )}
                <button
                  className={styles.sendButton}
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
            <div className={styles.conversationEmpty}>
              <span className={styles.emptyMessageMark} aria-hidden="true">
                <MessageCircle size={31} />
              </span>
              <h2>Выберите собеседника</h2>
              <p>Создайте чат по номеру телефона, чтобы отправить текстовое сообщение.</p>
              <button className={`${styles.primaryButton} ${styles.emptyCreateButton}`} type="button" onClick={onOpenDialog}>
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
});
