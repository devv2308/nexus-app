import { useTheme } from "../../context/ThemeContext.jsx";
import { useLang }  from "../../context/LangContext.jsx";
import { useAuth }  from "../../hooks/useAuth.js";
import { NotifBadge } from "../ui/index.jsx";
import LangSelector  from "./LangSelector.jsx";

export default function Sidebar({ screen, setScreen, setShowCreate, unreadNotifs, unreadDMs, onGoProfile }) {
  const { theme: T } = useTheme();
  const { t }        = useLang();
  const { currentUser, logout } = useAuth();

  const nav = [
    { id: "feed",          icon: "⊞",  label: t("feed") },
    { id: "discover",      icon: "◈",  label: t("discover") },
    { id: "messages",      icon: "✉",  label: t("messages"),  badge: unreadDMs },
    { id: "notifications", icon: "🔔", label: t("alerts"),    badge: unreadNotifs },
    { id: "ai",            icon: "✦",  label: "Nexus AI",     accent: true },
  ];

  return (
    <div className="sidebar-left" style={{
      width: 218, borderRight: `1px solid ${T.border}`, padding: "22px 10px",
      display: "flex", flexDirection: "column", position: "sticky", top: 0,
      height: "100vh", background: T.surface, flexShrink: 0, overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ fontFamily: "'Georgia', serif", fontSize: 25, fontWeight: 700, color: T.text, marginBottom: 28, paddingLeft: 10 }}>
        nexus<span style={{ color: T.accent }}>.</span>
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {nav.map((item) => {
          const active = screen === item.id;
          return (
            <button key={item.id} type="button" onClick={() => setScreen(item.id)}
              style={{
                display: "flex", gap: 10, alignItems: "center",
                padding: "10px 12px", borderRadius: 8, position: "relative",
                background: active
                  ? item.accent ? `linear-gradient(135deg,${T.accent}20,${T.info}12)` : T.accent + "16"
                  : "transparent",
                color: active ? (item.accent ? T.accent : T.accent) : item.accent ? T.info : T.muted,
                fontWeight: active ? 600 : 400, fontSize: 14,
                border: active && item.accent ? `1px solid ${T.accent}30` : "1px solid transparent",
                cursor: "pointer",
              }}>
              <span style={{ fontSize: 15, position: "relative" }}>
                {item.icon}
                {item.badge > 0 && <NotifBadge count={item.badge} />}
              </span>
              {item.label}
            </button>
          );
        })}

        <div style={{ borderTop: `1px solid ${T.border}`, margin: "8px 0" }} />

        <button type="button" onClick={() => setShowCreate(true)}
          style={{
            display: "flex", gap: 8, alignItems: "center",
            padding: "10px 12px", borderRadius: 8, background: T.accent,
            color: "#fff", fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer",
          }}>
          {t("newPost")}
        </button>
      </nav>

      {/* Bottom: lang + user */}
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <LangSelector />
        <div onClick={() => onGoProfile(currentUser)}
          style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, cursor: "pointer", padding: "6px 8px", borderRadius: 8, marginTop: 8 }}
          onMouseEnter={(e) => e.currentTarget.style.background = T.surface2}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: T.surface2, border: `1.5px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: T.accent,
            }}>
              {(currentUser?.initials || currentUser?.name?.[0] || "?").slice(0, 2)}
            </div>
            <span style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: T.success, border: `1.5px solid ${T.surface}` }} />
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ color: T.text, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser?.name}</p>
            <p style={{ color: T.muted, fontSize: 11 }}>@{currentUser?.username}</p>
          </div>
        </div>
        <button type="button" onClick={logout}
          style={{ width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 12, color: T.muted, background: "transparent", border: `1px solid ${T.border}`, cursor: "pointer" }}>
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}
