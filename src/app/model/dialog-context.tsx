/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useMemo, type ReactNode } from "react";

interface DialogContextValue {
  dialogOpen: boolean;
  checkingNumber: boolean;
  dialogError: string | null;
  onCreateChat: (phoneNumber: string) => Promise<boolean>;
  onOpenDialog: () => void;
  onCloseDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DialogContextValue;
}) {
  // Dialog consumers only observe dialog state and handlers, not chat or composer changes.
  const contextValue = useMemo(() => ({
    dialogOpen: value.dialogOpen,
    checkingNumber: value.checkingNumber,
    dialogError: value.dialogError,
    onCreateChat: value.onCreateChat,
    onOpenDialog: value.onOpenDialog,
    onCloseDialog: value.onCloseDialog,
  }), [
    value.checkingNumber,
    value.dialogError,
    value.dialogOpen,
    value.onCloseDialog,
    value.onCreateChat,
    value.onOpenDialog,
  ]);

  return <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>;
}

export function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialogContext must be used within DialogProvider");
  return context;
}