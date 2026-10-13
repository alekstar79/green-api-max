import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types/chat";

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

export function MessageTimeline({ messages, onRetry }: MessageTimelineProps) {
  const timeline = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timeline.current) {
      timeline.current.scrollTop = timeline.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      className="message-timeline"
      role="log"
      aria-label="История сообщений"
      aria-live="polite"
      ref={timeline}
    >
      {messages.length === 0 ? (
        <div className="message-empty-state">
          <p>Начните переписку</p>
          <span>Отправьте первое сообщение собеседнику.</span>
        </div>
      ) : (
        messages.map((message) => (
          <article
            className={`message-row message-${message.direction}`}
            key={message.id}
            aria-label={message.direction === "incoming" ? "Входящее сообщение" : "Исходящее сообщение"}
          >
            <div className="message-bubble">
              <p className="message-text">{message.text}</p>
              <div className="message-meta">
                <time dateTime={new Date(message.sentAt).toISOString()}>
                  {formatMessageTime(message.sentAt)}
                </time>
                {message.direction === "outgoing" && (
                  <span className={`message-status status-${message.status}`}>
                    {message.status === "sending" && "Отправка"}
                    {message.status === "accepted" && "Принято API"}
                    {message.status === "failed" && "Не отправлено"}
                  </span>
                )}
              </div>
              {message.status === "failed" && (
                <button className="retry-button" type="button" onClick={() => onRetry(message)}>
                  Повторить
                </button>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}