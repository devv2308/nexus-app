import { useTheme } from "../context/ThemeContext.jsx";
import { useLang } from "../context/LangContext.jsx";
import { Btn, Avatar } from "../components/ui/index.jsx";
import { timeAgo } from "../utils/helpers.js";

export default function NotificationsPage({ notifs, users, onMarkAll, onMarkOne }) {
  const { theme: T } = useTheme();
  const { t } = useLang();
  const unread = notifs.filter((n) => !n.read).length;

  const iconFor = (tp) => ({ like: "♥", comment: "💬", follow: "👤", mention: "@", message: "✉" }[tp] || "🔔");
  const colFor  = (tp) => ({ like: T.danger, comment: T.info, follow: T.success, mention: T.accent, message: T.accent }[tp] || T.muted);

  const grouped = notifs.reduce((acc, n) => {
    const date = new Date(n.created_at || n.ts);
    const now  = new Date();
    const diffDays = Math.floor((now - date) / 86400000);
    const key  = diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : "Earlier";
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 24, fontWeight: 300, color: T.text }}>{t("notifTitle")}</h2>
          {unread > 0 && <p style={{ color: T.accent, fontSize: 13, marginTop: 2 }}>{unread} {t("unread")}</p>}
        </div>
        {unread > 0 && (
          <Btn variant="ghost" onClick={onMarkAll} style={{ fontSize: 12 }}>{t("markAllRead")}</Btn>
        )}
      </div>

      {notifs.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: T.muted, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>🔔</p>
          <p style={{ fontSize: 15 }}>{t("noNotifs")}</p>
          <p style={{ fontSize: 13, marginTop: 6, color: T.muted }}>Likes, comments, follows and messages appear here in real-time.</p>
        </div>
      )}

      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} style={{ marginBottom: 20 }}>
          <p style={{ color: T.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{group}</p>
          {items.map((n) => {
            const from = users?.find((u) => u.id === n.from_user_id) || n.from_user;
            const col  = colFor(n.type);
            return (
              <div key={n.id} onClick={() => onMarkOne(n.id)}
                style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  padding: "13px 16px", borderRadius: 10, marginBottom: 6, cursor: "pointer",
                  background: n.read ? "transparent" : T.accent + "08",
                  border: `1px solid ${n.read ? T.border : T.accent + "20"}`,
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = T.surface2}
                onMouseLeave={(e) => e.currentTarget.style.background = n.read ? "transparent" : T.accent + "08"}>

                {/* Icon circle */}
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: col + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: col, flexShrink: 0 }}>
                  {iconFor(n.type)}
                </div>

                {/* From-user avatar + text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                    {from && <Avatar name={from.name} initials={from.initials} size={22} />}
                    <p style={{ color: T.text, fontSize: 14, lineHeight: 1.45 }}>
                      <strong>{from?.name || "Someone"}</strong>{" "}{n.text}
                    </p>
                  </div>
                  <p style={{ color: T.muted, fontSize: 11 }}>
                    {timeAgo(new Date(n.created_at || n.ts || Date.now()).getTime(), t("justNow"))}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, flexShrink: 0, marginTop: 6 }} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
