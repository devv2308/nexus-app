import { useState, useCallback, useRef, useEffect } from "react";
import { chatApi } from "../api/index.js";
import { useAuth } from "./useAuth.js";

export function useChat() {
  const { currentUser } = useAuth();
  const [convos, setConvos]     = useState([]);
  const [messages, setMessages] = useState({});   // { convoId: Message[] }
  const [typingMap, setTypingMap] = useState({});  // { convoId: username | null }
  const wsRef    = useRef(null);
  const typingTm = useRef(null);

  const loadConvos = useCallback(async () => {
    try {
      const data = await chatApi.listConversations();
      setConvos(data);
    } catch (e) { console.error("Convos failed:", e.message); }
  }, []);

  const loadMessages = useCallback(async (convoId) => {
    try {
      const data = await chatApi.getMessages(convoId);
      setMessages((prev) => ({ ...prev, [convoId]: data }));
      setConvos((prev) =>
        prev.map((c) => (c.id === convoId ? { ...c, unread_count: 0 } : c))
      );
    } catch (e) { console.error("Messages failed:", e.message); }
  }, []);

  const openSocket = useCallback((convoId) => {
    // Close any existing socket for a different convo
    if (wsRef.current) wsRef.current.close();

    wsRef.current = chatApi.openSocket(convoId, {
      onMessage: (msg) => {
        if (msg.event === "new_message") {
          setMessages((prev) => {
            const existing = prev[convoId] || [];
            const localIdx = existing.findIndex(
              (item) =>
                item._local &&
                item.sender_id === msg.sender_id &&
                item.text === msg.text
            );

            if (localIdx >= 0) {
              const next = [...existing];
              next[localIdx] = msg;
              return { ...prev, [convoId]: next };
            }

            if (existing.some((item) => item.id === msg.id)) {
              return prev;
            }

            return {
              ...prev,
              [convoId]: [...existing, msg],
            };
          });
          setConvos((prev) =>
            prev.map((c) =>
              c.id === convoId
                ? { ...c, last_message: msg.text, last_sender_id: msg.sender_id }
                : c
            )
          );
          // Clear typing indicator when message arrives
          setTypingMap((prev) => ({ ...prev, [convoId]: null }));
        }

        if (msg.event === "typing" && msg.user_id !== currentUser?.id) {
          setTypingMap((prev) => ({ ...prev, [convoId]: msg.username }));
          // Auto-clear after 3 s
          clearTimeout(typingTm.current);
          typingTm.current = setTimeout(
            () => setTypingMap((prev) => ({ ...prev, [convoId]: null })),
            3000
          );
        }
      },
    });
    return wsRef.current;
  }, [currentUser?.id]);

  const sendMessage = useCallback(async (convoId, text) => {
    if (wsRef.current?.socket?.readyState === WebSocket.OPEN) {
      wsRef.current.send(text);
      // Optimistic local echo so the sender sees the bubble instantly
      setMessages((prev) => ({
        ...prev,
        [convoId]: [
          ...(prev[convoId] || []),
          {
            id: `local-${Date.now()}`,
            sender_id: currentUser?.id,
            text,
            created_at: new Date().toISOString(),
            _local: true,
          },
        ],
      }));
      setConvos((prev) =>
        prev.map((c) => (c.id === convoId ? { ...c, last_message: text } : c))
      );
    } else {
      // Fallback to HTTP if socket is not available
      const msg = await chatApi.sendMessage(convoId, text);
      setMessages((prev) => ({
        ...prev,
        [convoId]: [...(prev[convoId] || []), msg],
      }));
      setConvos((prev) =>
        prev.map((c) => (c.id === convoId ? { ...c, last_message: text } : c))
      );
    }
  }, [currentUser?.id]);

  const sendTyping = useCallback((convoId) => {
    if (wsRef.current?.socket?.readyState === WebSocket.OPEN) {
      wsRef.current.sendTyping?.();
    }
  }, []);

  const startConversation = useCallback(async (userId) => {
    const convo = await chatApi.startConversation(userId);
    await loadConvos();
    return convo;
  }, [loadConvos]);

  // Cleanup on unmount
  useEffect(() => () => {
    wsRef.current?.close();
    clearTimeout(typingTm.current);
  }, []);

  useEffect(() => {
    wsRef.current?.close();
    wsRef.current = null;
    clearTimeout(typingTm.current);
    setConvos([]);
    setMessages({});
    setTypingMap({});
  }, [currentUser?.id]);

  return {
    convos,
    messages,
    typingMap,
    loadConvos,
    loadMessages,
    openSocket,
    sendMessage,
    sendTyping,
    startConversation,
  };
}
