/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ChatContact } from "@/entities/chat";

interface ChatContextValue {
  chat: ChatContact | null;
  pollStatus: "idle" | "listening" | "retrying";
  pollError: string | null;
  onSelectChat: () => void;
  onMobileBack: () => void;
  mobileChatOpen: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ChatContextValue;
}) {
  // This slice excludes compose/dialog state; narrow dependencies keep its subscribers isolated.
  const contextValue = useMemo(() => ({
    chat: value.chat,
    pollStatus: value.pollStatus,
    pollError: value.pollError,
    onSelectChat: value.onSelectChat,
    onMobileBack: value.onMobileBack,
    mobileChatOpen: value.mobileChatOpen,
  }), [
    value.chat,
    value.mobileChatOpen,
    value.onMobileBack,
    value.onSelectChat,
    value.pollError,
    value.pollStatus,
  ]);

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChatContext must be used within ChatProvider");
  return context;
}
