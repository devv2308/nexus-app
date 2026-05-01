import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { avatarColor } from "../../utils/helpers.js";

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name = "", initials: ini, size = 40, live = false, online = false }) {
  const { theme: T } = useTheme();
  const bg    = avatarColor(name);
  const label = (ini || name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("")).slice(0, 2);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: bg + "22", border: `1.5px solid ${live ? T.live : bg + "44"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: bg, fontWeight: 600, fontSize: size * 0.36,
      }}>
        {label}
      </div>
      {live && (
        <span style={{
          position: "absolute", bottom: -2, right: -2,
          background: T.live, borderRadius: 3, fontSize: 8,
          fontWeight: 800, color: "#fff", padding: "1px 4px", lineHeight: 1.4,
        }}>LIVE</span>
      )}
      {!live && online && (
        <span style={{
          position: "absolute", bottom: 1, right: 1,
          width: 9, height: 9, borderRadius: "50%",
          background: T.success, border: `2px solid ${T.bg}`,
        }} />
      )}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 14 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: "2px solid currentColor", borderTopColor: "transparent",
      borderRadius: "50%", animation: "spin .8s linear infinite",
    }} />
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "primary", style: s, disabled, loading, type = "button" }) {
  const { theme: T } = useTheme();
  const variants = {
    primary: { background: T.accent,        color: "#fff" },
    ghost:   { background: "transparent",   color: T.text,   border: `1px solid ${T.border}` },
    subtle:  { background: T.accent + "18", color: T.accent, border: `1px solid ${T.accent}30` },
    live:    { background: T.live,          color: "#fff" },
    danger:  { background: T.danger + "18", color: T.danger, border: `1px solid ${T.danger}30` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{
        padding: "9px 18px", borderRadius: 8, fontWeight: 500, fontSize: 13,
        display: "inline-flex", alignItems: "center", gap: 6,
        transition: "opacity .15s", opacity: disabled || loading ? 0.5 : 1,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        border: "none", ...variants[variant], ...s,
      }}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

// ── Text Input ────────────────────────────────────────────────────────────────
export function TInput({ value, onChange, placeholder, multiline, rows = 4, type = "text", style: s, autoComplete }) {
  const { theme: T } = useTheme();
  const base = {
    background: T.surface2, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: "10px 14px", color: T.text,
    fontSize: 14, width: "100%", lineHeight: 1.65, outline: "none", ...s,
  };
  if (multiline)
    return <textarea style={{ ...base, resize: "none" }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
  return <input style={base} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} />;
}

// ── Password Input ────────────────────────────────────────────────────────────
export function PasswordInput({ value, onChange, placeholder, autoComplete = "current-password" }) {
  const { theme: T } = useTheme();
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        style={{
          width: "100%", background: T.surface2, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "11px 50px 11px 14px",
          color: T.text, fontSize: 14, outline: "none", lineHeight: 1.5,
        }}
      />
      <button type="button" onClick={() => setShow((s) => !s)}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: T.muted, fontSize: 12, fontWeight: 600, padding: 0,
        }}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ label }) {
  const { theme: T } = useTheme();
  return (
    <span style={{
      background: T.accent + "14", color: T.accent,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 500,
    }}>#{label}</span>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ margin = "14px 0" }) {
  const { theme: T } = useTheme();
  return <div style={{ borderTop: `1px solid ${T.border}`, margin }} />;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ children, onClose, maxWidth = 560 }) {
  const { theme: T } = useTheme();
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(8,6,3,.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="su" style={{
        background: T.surface, border: `1px solid ${T.border}40`,
        borderRadius: 16, width: "100%", maxWidth, padding: 28,
        boxShadow: "0 24px 60px rgba(0,0,0,.6)", maxHeight: "92vh", overflowY: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }) {
  const { theme: T } = useTheme();
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 42, height: 24, borderRadius: 12,
        background: on ? T.accent : T.border,
        cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0,
      }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 20 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)",
      }} />
    </div>
  );
}

// ── Radio Group ───────────────────────────────────────────────────────────────
export function RadioGroup({ options, value, onChange }) {
  const { theme: T } = useTheme();
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
            background: value === o.value ? T.accent + "20" : "transparent",
            color: value === o.value ? T.accent : T.muted,
            border: `1px solid ${value === o.value ? T.accent + "50" : T.border}`,
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ message, type = "success" }) {
  const { theme: T } = useTheme();
  if (!message) return null;
  const bg = type === "error" ? T.danger : T.success;
  return (
    <div className="toast-anim" style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: bg, color: "#fff", padding: "10px 22px",
      borderRadius: 8, fontSize: 14, fontWeight: 500,
      zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,.4)", whiteSpace: "nowrap",
    }}>
      {message}
    </div>
  );
}

// ── Section Label (Settings) ──────────────────────────────────────────────────
export function SectionLabel({ label }) {
  const { theme: T } = useTheme();
  return (
    <p style={{
      color: T.accent, fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: 0.8, marginTop: 24, marginBottom: 4,
    }}>{label}</p>
  );
}

// ── Setting Row ───────────────────────────────────────────────────────────────
export function SettingRow({ icon, title, subtitle, right }) {
  const { theme: T } = useTheme();
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 0", borderBottom: `1px solid ${T.border}22`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: T.surface2,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ color: T.text, fontSize: 14, fontWeight: 500 }}>{title}</p>
        {subtitle && <p style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  );
}

// ── Notification Bell Badge ───────────────────────────────────────────────────
export function NotifBadge({ count }) {
  const { theme: T } = useTheme();
  if (!count || count < 1) return null;
  return (
    <span style={{
      position: "absolute", top: -4, right: -6,
      background: T.danger, color: "#fff",
      borderRadius: 10, minWidth: 16, height: 16,
      fontSize: 9, fontWeight: 800, padding: "0 4px",
      display: "flex", alignItems: "center", justifyContent: "center",
      lineHeight: 1, border: `2px solid ${T.bg}`,
    }}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
