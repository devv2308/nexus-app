import { useTheme }   from "../../context/ThemeContext.jsx";
import { useLang }    from "../../context/LangContext.jsx";
import { NotifBadge } from "../ui/index.jsx";

export default function BottomNav({ screen, setScreen, unreadNotifs, unreadDMs }) {
  const { theme: T } = useTheme();
  const { t }        = useLang();

  const items = [
    { id: "feed",          icon: "⊞",  label: t("feed") },
    { id: "discover",      icon: "◈",  label: t("discover") },
    { id: "messages",      icon: "✉",  label: t("messages"),  badge: unreadDMs },
    { id: "notifications", icon: "🔔", label: t("alerts"),    badge: unreadNotifs },
    { id: "ai",            icon: "✦",  label: "AI",           accent: true },
    { id: "profile",       icon: "◎",  label: t("profile") },
  ];

  return (
    <div className="bottom-nav" style={{
      display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
      background: T.surface, borderTop: `1px solid ${T.border}`,
      padding: "6px 0 env(safe-area-inset-bottom, 6px)",
      zIndex: 100, justifyContent: "space-around",
    }}>
      {items.map((item) => {
        const active = screen === item.id;
        const color  = active
          ? item.accent ? T.accent : T.accent
          : item.accent ? T.info : T.muted;
        return (
          <button key={item.id} type="button" onClick={() => setScreen(item.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, padding: "3px 8px", color,
              border: "none", background: "none", cursor: "pointer",
              fontSize: 9, fontWeight: active ? 700 : 500, position: "relative",
            }}>
            <span style={{ fontSize: 17, position: "relative" }}>
              {item.icon}
              {item.badge > 0 && <NotifBadge count={item.badge} />}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
