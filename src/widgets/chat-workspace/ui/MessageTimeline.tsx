import { memo, useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "@/entities/message";
import { classNames } from "@/shared/lib/class-names";
import styles from "./MessageTimeline.module.css";

interface MessageTimelineProps {
  messages: ChatMessage[];
  onRetry: (message: ChatMessage) => void;
}

function formatMessageTime(timestamp: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export const MessageTimeline = memo(function MessageTimeline({ messages, onRetry }: MessageTimelineProps) {
  const timeline = useRef<HTMLDivElement>(null);
  const handleRetry = useCallback((message: ChatMessage) => {
    onRetry(message);
  }, [onRetry]);
  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    if (timeline.current) {
      timeline.current.scrollTop = timeline.current.scrollHeight;
    }
  }, [lastMessageId]);

  return (
    <div
      className={styles.timeline}
      role="log"
      aria-label="История сообщений"
      aria-live="polite"
      ref={timeline}
    >
      {messages.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Начните переписку</p>
          <span>Отправьте первое сообщение собеседнику.</span>
        </div>
      ) : (
        messages.map((message) => (
          <article
            className={classNames(
              styles.messageRow,
              message.direction === "incoming" ? styles.incoming : styles.outgoing,
            )}
            key={message.id}
            aria-label={message.direction === "incoming" ? "Входящее сообщение" : "Исходящее сообщение"}
          >
            <div className={styles.bubble}>
              <p className={styles.text}>{message.text}</p>
              <div className={styles.meta}>
                <time dateTime={new Date(message.sentAt).toISOString()}>
                  {formatMessageTime(message.sentAt)}
                </time>
                {message.direction === "outgoing" && (
                  <span className={classNames(
                    styles.status,
                    message.status === "accepted" && styles.statusAccepted,
                    message.status === "failed" && styles.statusFailed,
                  )}>
                    {message.status === "sending" && "Отправка"}
                    {message.status === "accepted" && "Принято API"}
                    {message.status === "failed" && "Не отправлено"}
                  </span>
                )}
              </div>
              {message.status === "failed" && (
                <button className={styles.retryButton} type="button" onClick={() => handleRetry(message)}>
                  Повторить
                </button>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
});
