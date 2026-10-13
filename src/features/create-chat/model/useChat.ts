import { useCallback, useState } from "react";
import type { ChatContact } from "@/entities/chat";
import { GreenApiError, type GreenApiClient } from "@/shared/api/green-api";
import { isValidMaxPhoneNumber, normalizePhoneNumber, phoneNumberError } from "@/shared/lib/phone";

function getChatError(error: unknown): string {
  return error instanceof GreenApiError
    ? error.message
    : "Не удалось проверить номер. Проверьте сеть и попробуйте снова.";
}

export function useChat(client: GreenApiClient | null) {
  const [chat, setChat] = useState<ChatContact | null>(null);
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const createChat = useCallback(async (phoneNumber: string): Promise<boolean> => {
    if (!isValidMaxPhoneNumber(phoneNumber)) {
      setDialogError(phoneNumberError(phoneNumber));
      return false;
    }
    if (!client) {
      setDialogError("Сначала подключите инстанс GREEN-API.");
      return false;
    }

    setCheckingNumber(true);
    setDialogError(null);
    try {
      const normalizedNumber = normalizePhoneNumber(phoneNumber);
      const result = await client.checkAccount(Number(normalizedNumber));
      if (result.status === false) {
        setDialogError(result.reason ?? "Инстанс не готов к работе.");
        return false;
      }
      if (!result.exist || !result.chatId) {
        setDialogError("Для этого номера не найден аккаунт MAX.");
        return false;
      }
      setChat({ chatId: result.chatId, phoneNumber: normalizedNumber });
      setDialogOpen(false);
      setDialogError(null);
      return true;
    } catch (requestError) {
      setDialogError(getChatError(requestError));
      return false;
    } finally {
      setCheckingNumber(false);
    }
  }, [client]);

  const openDialog = useCallback(() => {
    setDialogError(null);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setDialogError(null);
  }, []);

  const reset = useCallback(() => {
    setChat(null);
    setCheckingNumber(false);
    setDialogError(null);
    setDialogOpen(false);
  }, []);

  return {
    chat,
    checkingNumber,
    dialogError,
    dialogOpen,
    createChat,
    openDialog,
    closeDialog,
    reset,
  };
}