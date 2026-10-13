import { useCallback, useState } from "react";
import type { Credentials } from "@/entities/credentials";
import { createGreenApiClient, type GreenApiClient } from "@/shared/api/green-api";
import { API_BASE_URL } from "@/shared/config";

export function useCredentials() {
  const [client, setClient] = useState<GreenApiClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback((credentials: Credentials): boolean => {
    const idInstance = credentials.idInstance.trim();
    const apiTokenInstance = credentials.apiTokenInstance.trim();
    if (!/^\d+$/.test(idInstance) || !apiTokenInstance) {
      setError("Проверьте ID инстанса и токен API.");
      return false;
    }
    setError(null);
    setClient(createGreenApiClient(idInstance, apiTokenInstance, API_BASE_URL));
    return true;
  }, []);

  const reset = useCallback(() => {
    setClient(null);
    setError(null);
  }, []);

  return { client, error, connect, reset };
}