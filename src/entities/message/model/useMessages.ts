import { useCallback, useState } from "react";
import type { ChatMessage } from "./types";

// Domain actions keep message transitions explicit instead of exposing unrestricted state replacement.
export function useMessages() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const addIncoming = useCallback((message: ChatMessage) => {
        setMessages((current) => [...current, message]);
    }, []);

    const addOutgoing = useCallback((message: ChatMessage) => {
        setMessages((current) => current.some((item) => item.id === message.id)
            ? current.map((item) => item.id === message.id ? message : item)
            : [...current, message]);
    }, []);

    const confirmSent = useCallback((localId: string, serverId: string) => {
        setMessages((current) => current.map((message) => message.id === localId
            ? { ...message, id: serverId, status: "accepted" }
            : message));
    }, []);

    const markFailed = useCallback((localId: string) => {
        setMessages((current) => current.map((message) => message.id === localId
            ? { ...message, status: "failed" }
            : message));
    }, []);

    const replaceAll = useCallback((nextMessages: ChatMessage[]) => {
        setMessages(nextMessages);
    }, []);

    const clear = useCallback(() => {
        setMessages([]);
    }, []);

    return { messages, addIncoming, addOutgoing, confirmSent, markFailed, replaceAll, clear };
}