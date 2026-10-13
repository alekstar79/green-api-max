/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ChatMessage } from "@/entities/message";

interface ComposerContextValue {
  onSendMessage: (text: string) => void;
  onRetryMessage: (message: ChatMessage) => void;
  sending: boolean;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

export function ComposerProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ComposerContextValue;
}) {
  // A separate, narrow value prevents chat navigation or dialog updates from notifying composer consumers.
  const contextValue = useMemo(() => ({
    onSendMessage: value.onSendMessage,
    onRetryMessage: value.onRetryMessage,
    sending: value.sending,
  }), [
    value.onRetryMessage,
    value.onSendMessage,
    value.sending,
  ]);

  return <ComposerContext.Provider value={contextValue}>{children}</ComposerContext.Provider>;
}

export function useComposerContext() {
  const context = useContext(ComposerContext);
  if (!context) throw new Error("useComposerContext must be used within ComposerProvider");
  return context;
}