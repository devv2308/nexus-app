import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { Avatar, Modal } from "../components/ui/index.jsx";
import { timeAgo } from "../utils/helpers.js";

export default function MessagesPage({
  convos, users, messages, typingMap,
  onSend, onNewConvo, onLoadMessages, onOpenSocket,
  wallpaper = "none", readReceipts = true, onSendTyping,
}) {
  const { theme: T } = useTheme();
  const { t } = useLang();
  const { currentUser } = useAuth();

  const [active, setActive]     = useState(null);
  const [msg, setMsg]           = useState("");
  const [showNew, setShowNew]   = useState(false);
  const [search, setSearch]     = useState("");
  const bottomRef               = useRef();
  const inputRef                = useRef();
  const typingTm                = useRef();

  const activeConvo = convos.find((c) => c.id === active?.id) || active;
  const convoMsgs   = messages[activeConvo?.id] || [];
  const others      = users.filter((u) => u.id !== currentUser?.id);
  const isTyping    = typingMap?.[activeConvo?.id];

  const getOther = (c) => {
    const otherId = c.participants?.find?.((id) => id !== currentUser?.id) || c.other_user?.id;
    return c.other_user || users.find((u) => u.id === otherId) || { name: "Unknown", username: "unknown", initials: "?" };
  };

  // Open socket + load messages when active conversation changes
  useEffect(() => {
    if (!activeConvo) return;
    onLoadMessages(activeConvo.id);
    const ws = onOpenSocket?.(activeConvo.id);
    return () => { ws?.close?.(); };
  }, [activeConvo?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convoMsgs.length]);

  const send = () => {
    if (!msg.trim() || !activeConvo) return;
    onSend(activeConvo.id, msg.trim());
    setMsg("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInput = (e) => {
    setMsg(e.target.value);
    // Emit typing event (debounced)
    clearTimeout(typingTm.current);
    typingTm.current = setTimeout(() => onSendTyping?.(activeConvo?.id), 200);
  };

  const filteredConvos = convos.filter((c) => {
    if (!search) return true;
    const oth = getOther(c);
    return oth.name?.toLowerCase().includes(search.toLowerCase()) ||
           oth.username?.toLowerCase().includes(search.toLowerCase());
  });

  // Wallpaper patterns
  const wallpaperStyle = {
    none:   {},
    dots:   { backgroundImage: `radial-gradient(${T.border} 1px, transparent 1px)`, backgroundSize: "20px 20px" },
    grid:   { backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`, backgroundSize: "24px 24px" },
    waves:  { backgroundImage: `repeating-linear-gradient(45deg, ${T.border} 0, ${T.border} 1px, transparent 0, transparent 50%)`, backgroundSize: "18px 18px" },
    geo:    { backgroundImage: `linear-gradient(60deg, ${T.border} 25%, transparent 25%, transparent 75%, ${T.border} 75%, ${T.border}), linear-gradient(60deg, ${T.border} 25%, transparent 25%, transparent 75%, ${T.border} 75%, ${T.border})`, backgroundSize: "20px 35px", backgroundPosition: "0 0, 10px 17px" },
  }[wallpaper] || {};

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 24, fontWeight: 300, color: T.text }}>{t("messagesTitle")}</h2>
        <button type="button" onClick={() => setShowNew(true)}
          style={{ padding: "8px 16px", borderRadius: 8, background: T.accent, color: "#fff", fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer" }}>
          {t("newMessage")}
        </button>
      </div>

      {/* New conversation modal */}
      {showNew && (
        <Modal onClose={() => setShowNew(false)} maxWidth={360}>
          <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 18, fontWeight: 400, color: T.text, marginBottom: 16 }}>{t("newMessage")}</h3>
          <input
            placeholder="Search people…"
            style={{ width: "100%", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", marginBottom: 12 }}
            onChange={(e) => setSearch(e.target.value)}
          />
          {others.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())).map((u) => (
            <button key={u.id} type="button"
              onClick={async () => {
                const convo = await onNewConvo(u.id);
                setActive(convo);
                setShowNew(false);
                setSearch("");
              }}
              style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: T.surface2, border: `1px solid ${T.border}`, cursor: "pointer", width: "100%", marginBottom: 8 }}>
              <Avatar name={u.name} initials={u.initials} size={36} online={u.is_online} />
              <div style={{ textAlign: "left" }}>
                <p style={{ color: T.text, fontSize: 14, fontWeight: 500 }}>{u.name}</p>
                <p style={{ color: T.muted, fontSize: 12 }}>@{u.username} {u.is_online ? "· 🟢 Online" : ""}</p>
              </div>
            </button>
          ))}
        </Modal>
      )}

      <div style={{ display: "flex", gap: 14, height: "calc(100vh - 190px)", minHeight: 400 }}>

        {/* ── Conversation list ── */}
        <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          <input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 10px", color: T.text, fontSize: 13, outline: "none", marginBottom: 8 }}
          />
          {filteredConvos.length === 0 && (
            <p style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 20 }}>No conversations yet.</p>
          )}
          {filteredConvos.map((c) => {
            const oth  = getOther(c);
            const isA  = activeConvo?.id === c.id;
            const snap = c.last_message ? (c.last_message.length > 28 ? c.last_message.slice(0, 28) + "…" : c.last_message) : "…";
            return (
              <button key={c.id} type="button" onClick={() => setActive(c)}
                style={{
                  display: "flex", gap: 10, alignItems: "center", padding: "10px 11px",
                  borderRadius: 10, textAlign: "left",
                  background: isA ? T.accent + "18" : "transparent",
                  border: isA ? `1px solid ${T.accent}30` : "1px solid transparent",
                  cursor: "pointer",
                }}>
                <Avatar name={oth.name} initials={oth.initials} size={38} online={oth.is_online} />
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ color: T.text, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{oth.name}</p>
                    {c.last_message_at && <span style={{ color: T.muted, fontSize: 10, flexShrink: 0, marginLeft: 4 }}>{timeAgo(new Date(c.last_message_at).getTime(), "now")}</span>}
                  </div>
                  <p style={{ color: c.unread_count > 0 ? T.text : T.muted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: c.unread_count > 0 ? 600 : 400 }}>{snap}</p>
                </div>
                {c.unread_count > 0 && (
                  <span style={{ background: T.accent, color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.unread_count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!activeConvo ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.muted, gap: 12 }}>
              <span style={{ fontSize: 40 }}>💬</span>
              <p style={{ fontSize: 15 }}>{t("selectConvo")}</p>
            </div>
          ) : (() => {
            const oth = getOther(activeConvo);
            return (
              <>
                {/* Header */}
                <div style={{ padding: "13px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 10, alignItems: "center", background: T.surface }}>
                  <Avatar name={oth.name} initials={oth.initials} size={36} online={oth.is_online} />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>{oth.name}</p>
                    {isTyping
                      ? <p style={{ color: T.accent, fontSize: 12, fontStyle: "italic" }}>{isTyping} {t("typing")}</p>
                      : <p style={{ color: oth.is_online ? T.success : T.muted, fontSize: 12 }}>{oth.is_online ? "🟢 Online" : `@${oth.username}`}</p>
                    }
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", color: T.muted, fontSize: 13, cursor: "pointer" }}>📞</button>
                    <button type="button" style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", color: T.muted, fontSize: 13, cursor: "pointer" }}>📹</button>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, ...wallpaperStyle }}>
                  {convoMsgs.length === 0 && (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13 }}>
                      Say hello to {oth.name}! 👋
                    </div>
                  )}
                  {convoMsgs.map((m) => {
                    const mine = m.sender_id === currentUser?.id;
                    return (
                      <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: mine ? "row-reverse" : "row" }}>
                        {!mine && <Avatar name={oth.name} initials={oth.initials} size={26} />}
                        <div style={{ maxWidth: "72%" }}>
                          <div style={{
                            padding: "9px 13px",
                            borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                            background: mine ? T.accent : T.surface2,
                            color: mine ? "#fff" : T.text,
                            fontSize: 14, lineHeight: 1.55,
                            boxShadow: "0 1px 2px rgba(0,0,0,.15)",
                          }}>
                            {m.text}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3, justifyContent: mine ? "flex-end" : "flex-start" }}>
                            <span style={{ color: T.muted, fontSize: 10 }}>
                              {timeAgo(new Date(m.created_at || m.ts || Date.now()).getTime(), t("justNow"))}
                            </span>
                            {mine && (
                              <span style={{ color: readReceipts ? "#4a9eff" : T.muted, fontSize: 11 }}>
                                {readReceipts ? "✔✔" : "✔"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div style={{ padding: "10px 13px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, background: T.surface, alignItems: "flex-end" }}>
                  <input
                    ref={inputRef}
                    value={msg}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={t("typeMsgPlaceholder")}
                    style={{
                      flex: 1, background: T.surface2, border: `1px solid ${T.border}`,
                      borderRadius: 20, padding: "10px 16px", color: T.text, fontSize: 14, outline: "none",
                    }}
                  />
                  <button type="button" onClick={send} disabled={!msg.trim()}
                    style={{
                      width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: msg.trim() ? T.accent : T.surface2,
                      color: msg.trim() ? "#fff" : T.muted,
                      border: "none", cursor: msg.trim() ? "pointer" : "not-allowed",
                      fontSize: 16, fontWeight: 700, flexShrink: 0,
                      transition: "background .2s",
                    }}>↑</button>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
