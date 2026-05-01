import { useTheme } from "../context/ThemeContext.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { Avatar } from "../components/ui/index.jsx";
import PostCard from "../components/feed/PostCard.jsx";

export default function FeedPage({ posts, users, onLike, onComment, onOpenDetail, onOpenCreate }) {
  const { theme: T } = useTheme();
  const { t } = useLang();
  const { currentUser } = useAuth();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 24, fontWeight: 300, color: T.text }}>{t("yourFeed")}</h2>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>{posts.length} {t("posts")}</p>
        </div>
        <button type="button" onClick={onOpenCreate} style={{ padding: "8px 16px", borderRadius: 8, background: T.accent, color: "#fff", fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer" }}>
          {t("newPost")}
        </button>
      </div>

      {/* Quick compose bar */}
      <div onClick={onOpenCreate} style={{
        display: "flex", gap: 12, alignItems: "center", background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 12, padding: 14,
        marginBottom: 20, cursor: "pointer", transition: "border-color .2s",
      }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = T.accent + "40"}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}>
        <Avatar name={currentUser?.name} initials={currentUser?.initials} size={34} />
        <span style={{ color: T.muted, fontSize: 14, flex: 1 }}>
          {t("whatsOnMind")}, {currentUser?.name?.split(" ")[0]}?
        </span>
        <span style={{ color: T.muted, fontSize: 18 }}>📷</span>
      </div>

      {posts.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: T.muted, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🌱</p>
          <p style={{ fontSize: 15 }}>Your feed is empty. Follow people or create your first post!</p>
        </div>
      )}

      {posts.map((p) => (
        <PostCard key={p.id} post={p} users={users} onLike={onLike} onComment={onComment} onOpenDetail={onOpenDetail} />
      ))}
    </div>
  );
}
