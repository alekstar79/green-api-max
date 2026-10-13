import { ConnectionForm } from "@/features/connect-instance";
import { ChatProvider } from "./model/chat-context";
import { ComposerProvider } from "./model/composer-context";
import { DialogProvider } from "./model/dialog-context";
import { useAppState } from "./model/useAppState";
import { ChatWorkspace } from "@/widgets/chat-workspace";

export function App() {
  const state = useAppState();

  if (!state.client) {
    return <ConnectionForm onConnect={state.onConnect} />;
  }

  return (
    <ChatProvider
      value={{
        chat: state.chat,
        pollStatus: state.polling.status,
        pollError: state.polling.error,
        onSelectChat: state.onSelectChat,
        onMobileBack: state.onMobileBack,
        mobileChatOpen: state.mobileChatOpen,
      }}
    >
      <ComposerProvider
        value={{
        onSendMessage: state.onSendMessage,
        onRetryMessage: state.onRetryMessage,
        sending: state.sending,
        }}
      >
        <DialogProvider
          value={{
            dialogOpen: state.dialogOpen,
            checkingNumber: state.checkingNumber,
            dialogError: state.dialogError,
            onCreateChat: state.onCreateChat,
            onOpenDialog: state.onOpenDialog,
            onCloseDialog: state.onCloseDialog,
          }}
        >
          <ChatWorkspace
            messages={state.messages}
            theme={state.theme}
            onToggleTheme={state.onToggleTheme}
            onLogout={state.onLogout}
          />
        </DialogProvider>
      </ComposerProvider>
    </ChatProvider>
  );
}
