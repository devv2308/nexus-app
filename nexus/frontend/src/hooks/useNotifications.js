import { useState, useCallback, useRef, useEffect } from "react";
import { notificationsApi, openNotifSocket } from "../api/index.js";
import { useAuth } from "./useAuth.js";

export function useNotifications() {
  const { currentUser } = useAuth();
  const [notifs, setNotifs]       = useState([]);
  const wsHandleRef               = useRef(null);
  const reconnectTm               = useRef(null);
  const shouldReconnectRef        = useRef(false);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearTimeout(reconnectTm.current);
    wsHandleRef.current?.close();
    wsHandleRef.current = null;
  }, []);

  const connectWS = useCallback(() => {
    // Close any previous socket
    wsHandleRef.current?.close();

    wsHandleRef.current = openNotifSocket({
      onMessage: (msg) => {
        if (msg.event === "new_notification") {
          // Prepend the incoming notification so the bell badge increments
          setNotifs((prev) => {
            // Avoid duplicates (e.g. if HTTP poll fires at same time)
            if (prev.some((n) => n.id === msg.id)) return prev;
            return [msg, ...prev];
          });
        }
      },
      onClose: () => {
        // Auto-reconnect after 4 s
        if (shouldReconnectRef.current) {
          reconnectTm.current = setTimeout(connectWS, 4000);
        }
      },
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await notificationsApi.list();
      setNotifs(data);
    } catch (e) {
      console.error("Notifs failed:", e.message);
    }
    // Open (or re-open) the WebSocket after loading history
    shouldReconnectRef.current = true;
    connectWS();
  }, [connectWS]);

  const markAll = async () => {
    await notificationsApi.markAll();
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOne = async (id) => {
    await notificationsApi.markOne(id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  // Cleanup on unmount
  useEffect(() => () => {
    disconnect();
  }, [disconnect]);

  useEffect(() => {
    disconnect();
    setNotifs([]);
  }, [currentUser?.id, disconnect]);

  return { notifs, unreadCount, load, markAll, markOne, disconnect };
}
