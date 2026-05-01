/**
 * hooks/useAI.js
 * Manages the full AI chat session: message history, sending, and streaming
 * responses from the Nexus /api/ai/chat endpoint.
 */
import { useState, useCallback, useRef } from "react";
import { getToken } from "../api/index.js";

export function useAI() {
  // Each item: { role: "user"|"assistant"|"error", content: string, ts: number }
  const [messages, setMessages] = useState([
    {
      role:    "assistant",
      content: "Hi! I'm **Nexus AI** ✦\n\nI can help you write posts, brainstorm ideas, summarise text, answer questions, and much more. What would you like to explore?",
      ts:      Date.now(),
    },
  ]);
  const [loading, setLoading]   = useState(false);
  const [aiInfo, setAiInfo]     = useState(null);   // { enabled, model, demo_mode }
  const abortRef                = useRef(null);

  // ── Fetch AI status on first mount ────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch("/api/ai/status", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setAiInfo(data);
    } catch { /* ignore */ }
  }, []);

  // ── Send a user message ───────────────────────────────────────────────────
  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text.trim(), ts: Date.now() };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Build history for the API (only role + content, no ts)
    const history = [...messages, userMsg]
      .filter((m) => m.role !== "error")
      .map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ messages: history }),
        signal: (abortRef.current = new AbortController()).signal,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, ts: Date.now(), model: data.model },
      ]);
    } catch (e) {
      if (e.name === "AbortError") return;
      setMessages((prev) => [
        ...prev,
        { role: "error", content: `⚠ ${e.message}`, ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([
      {
        role:    "assistant",
        content: "Conversation cleared. How can I help you?",
        ts:      Date.now(),
      },
    ]);
    setLoading(false);
  }, []);

  return { messages, loading, aiInfo, send, clear, fetchStatus };
}
