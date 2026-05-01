/**
 * pages/AIPage.jsx
 * Full-screen AI chat — ChatGPT-style UI wired to /api/ai/chat.
 * Features: multi-turn history, markdown-ish rendering, quick prompts,
 * copy to clipboard, clear session, demo-mode banner.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useLang }  from "../context/LangContext.jsx";
import { useAI }    from "../hooks/useAI.js";
import { Spinner }  from "../components/ui/index.jsx";

// ── Tiny markdown renderer (bold, italic, code, line-breaks) ─────────────────
function MdText({ text }) {
  const { theme: T } = useTheme();
  if (!text) return null;
  // Split on code blocks first
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const code = part.slice(3).replace(/^[a-z]*\n/, "").replace(/```$/, "");
          return (
            <pre key={i} style={{
              background: T.bg, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "10px 14px", fontSize: 12.5,
              overflowX: "auto", margin: "8px 0", fontFamily: "monospace",
              color: T.mutedLight, lineHeight: 1.6,
            }}>{code}</pre>
          );
        }
        if (part.startsWith("`")) {
          return <code key={i} style={{ background: T.bg, borderRadius: 4, padding: "1px 5px", fontSize: 12.5, fontFamily: "monospace", color: T.accent }}>{part.slice(1, -1)}</code>;
        }
        // Inline bold / italic / newlines
        return (
          <span key={i}>
            {part.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g).map((seg, j) => {
              if (seg.startsWith("**")) return <strong key={j}>{seg.slice(2, -2)}</strong>;
              if (seg.startsWith("*"))  return <em key={j}>{seg.slice(1, -1)}</em>;
              if (seg === "\n")         return <br key={j} />;
              return seg;
            })}
          </span>
        );
      })}
    </span>
  );
}

// ── Single chat bubble ───────────────────────────────────────────────────────
function Bubble({ msg, onCopy }) {
  const { theme: T } = useTheme();
  const isUser  = msg.role === "user";
  const isError = msg.role === "error";

  return (
    <div style={{
      display: "flex", gap: 10,
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-start",
      animation: "fadeUp .25s ease both",
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: isUser ? 13 : 16, fontWeight: 700,
        background: isUser
          ? T.accent + "22"
          : isError
          ? T.danger + "22"
          : "linear-gradient(135deg,#c97a2822,#4a7fa522)",
        color: isUser ? T.accent : isError ? T.danger : T.info,
        border: `1.5px solid ${isUser ? T.accent + "44" : isError ? T.danger + "44" : T.info + "33"}`,
      }}>
        {isUser ? "U" : isError ? "!" : "✦"}
      </div>

      {/* Content */}
      <div style={{ maxWidth: "82%", minWidth: 60 }}>
        <div style={{
          padding: "11px 15px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? T.accent
            : isError
            ? T.danger + "18"
            : T.surface,
          border: isUser ? "none" : `1px solid ${isError ? T.danger + "40" : T.border}`,
          color: isUser ? "#fff" : isError ? T.danger : T.text,
          fontSize: 14, lineHeight: 1.65,
          boxShadow: "0 1px 4px rgba(0,0,0,.1)",
        }}>
          <MdText text={msg.content} />
        </div>

        {/* Toolbar under AI messages */}
        {!isUser && !isError && (
          <div style={{ display: "flex", gap: 8, marginTop: 5, paddingLeft: 4 }}>
            <button type="button" onClick={() => onCopy(msg.content)}
              style={{ background: "none", border: "none", color: T.muted, fontSize: 11, cursor: "pointer", padding: "2px 6px", borderRadius: 4 }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = T.muted}>
              Copy
            </button>
            {msg.model && (
              <span style={{ color: T.muted, fontSize: 10, alignSelf: "center" }}>
                via {msg.model}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quick prompt chips ────────────────────────────────────────────────────────
const QUICK = [
  { label: "Write a post",    prompt: "Write a short, engaging social media post about building in public." },
  { label: "Explain AI",      prompt: "Explain how large language models work in simple terms." },
  { label: "Brainstorm",      prompt: "Give me 5 creative ideas for a tech startup focused on community building." },
  { label: "Improve my bio",  prompt: "Help me write a compelling 2-sentence bio for my social profile. I'm a software developer who loves design." },
  { label: "Translate text",  prompt: "Translate the following text to Spanish: 'Real-time communication is the future of social platforms.'" },
  { label: "Summarise",       prompt: "Summarise this concept in 3 bullet points: WebSockets vs HTTP polling for real-time apps." },
];

// ── Main page ────────────────────────────────────────────────────────────────
export default function AIPage() {
  const { theme: T }              = useTheme();
  const { t }                     = useLang();
  const { messages, loading, aiInfo, send, clear, fetchStatus } = useAI();

  const [input, setInput]         = useState("");
  const [copied, setCopied]       = useState(false);
  const bottomRef                 = useRef();
  const inputRef                  = useRef();

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    send(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [input, loading, send]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  const handleQuick = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", minHeight: 500 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 24, fontWeight: 300, color: T.text, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg,${T.accent}30,${T.info}20)`,
              border: `1.5px solid ${T.accent}40`, fontSize: 14,
            }}>✦</span>
            Nexus AI
          </h2>
          <p style={{ color: T.muted, fontSize: 12, marginTop: 3, marginLeft: 42 }}>
            {aiInfo?.demo_mode
              ? "Demo mode — add OPENAI_API_KEY to unlock full AI"
              : aiInfo
              ? `Powered by ${aiInfo.model}`
              : "Connecting…"}
          </p>
        </div>
        <button type="button" onClick={clear}
          style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer" }}>
          Clear chat
        </button>
      </div>

      {/* Demo-mode banner */}
      {aiInfo?.demo_mode && (
        <div style={{
          background: T.accent + "12", border: `1px solid ${T.accent}30`,
          borderRadius: 10, padding: "10px 16px", marginBottom: 14,
          display: "flex", gap: 10, alignItems: "center",
        }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <p style={{ color: T.accent, fontSize: 13, lineHeight: 1.5 }}>
            Running in demo mode. Set <code style={{ background: T.surface2, padding: "1px 4px", borderRadius: 3 }}>OPENAI_API_KEY</code> in{" "}
            <code style={{ background: T.surface2, padding: "1px 4px", borderRadius: 3 }}>backend/.env</code> for real AI responses.
          </p>
        </div>
      )}

      {/* Message list */}
      <div style={{
        flex: 1, overflowY: "auto", display: "flex",
        flexDirection: "column", gap: 16, paddingRight: 4, paddingBottom: 8,
      }}>
        {messages.map((msg, i) => (
          <Bubble key={i} msg={msg} onCopy={handleCopy} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${T.accent}22,${T.info}18)`, border: `1.5px solid ${T.info}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "16px 16px 16px 4px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map((d) => (
                <span key={d} style={{
                  width: 6, height: 6, borderRadius: "50%", background: T.muted,
                  display: "inline-block",
                  animation: `dotBounce 1.2s ease ${d * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompt chips — only show when no user messages yet */}
      {messages.filter((m) => m.role === "user").length === 0 && !loading && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {QUICK.map((q) => (
            <button key={q.label} type="button" onClick={() => handleQuick(q.prompt)}
              style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: T.surface, border: `1px solid ${T.border}`,
                color: T.muted, cursor: "pointer", transition: "all .15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: "flex", gap: 10, alignItems: "flex-end",
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "10px 14px",
        boxShadow: "0 -2px 16px rgba(0,0,0,.08)",
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask Nexus AI anything… (Enter to send, Shift+Enter for newline)"
          rows={input.split("\n").length > 3 ? 4 : Math.max(1, input.split("\n").length)}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: T.text, fontSize: 14, lineHeight: 1.6, resize: "none",
            fontFamily: "'DM Sans', sans-serif", maxHeight: 120, overflowY: "auto",
          }}
        />
        <button type="button" onClick={handleSend} disabled={!input.trim() || loading}
          style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: input.trim() && !loading ? T.accent : T.surface2,
            color: input.trim() && !loading ? "#fff" : T.muted,
            border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, transition: "background .2s",
          }}>
          {loading ? <Spinner size={16} /> : "↑"}
        </button>
      </div>

      {/* Dot-bounce keyframes injected once */}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
