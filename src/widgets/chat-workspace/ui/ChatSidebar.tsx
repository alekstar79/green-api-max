import { memo } from "react";
import { MessageCircle, Plus } from "lucide-react";
import type { ChatContact } from "@/entities/chat";
import type { ChatMessage } from "@/entities/message";
import { classNames } from "@/shared/lib/class-names";
import styles from "./ChatWorkspace.module.css";

interface ChatSidebarProps {
  chat: ChatContact | null;
  latestMessage: ChatMessage | undefined;
  onSelectChat: () => void;
  onOpenDialog: () => void;
}

export const ChatSidebar = memo(function ChatSidebar({
  chat,
  latestMessage,
  onSelectChat,
  onOpenDialog,
}: ChatSidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="Список чатов">
      <div className={styles.sidebarHeading}>
        <h1>Чаты</h1>
        <button
          className={`${styles.iconButton} ${styles.createChatButton}`}
          type="button"
          aria-label="Начать новый чат"
          title="Начать новый чат"
          onClick={onOpenDialog}
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>
      {chat ? (
        <button className={classNames(styles.chatListItem, styles.selected)} type="button" onClick={onSelectChat}>
          <span className={styles.contactPlaceholder} aria-hidden="true">
            <MessageCircle size={21} />
          </span>
          <span className={styles.chatListCopy}>
            <span className={styles.chatListTitle}>{chat.phoneNumber}</span>
            <span className={styles.chatListPreview}>{latestMessage?.text ?? "Новая переписка"}</span>
          </span>
          <span className={styles.chatListMeta}>MAX</span>
        </button>
      ) : (
        <div className={styles.sidebarEmpty}>
          <p>Здесь появятся ваши диалоги.</p>
          <button className={styles.textAction} type="button" onClick={onOpenDialog}>
            Создать чат
          </button>
        </div>
      )}
      <div className={styles.sidebarBottom}>
        <span className={styles.apiSessionLabel}>Подключение GREEN-API</span>
      </div>
    </aside>
  );
});