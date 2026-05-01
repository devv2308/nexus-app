import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useLang } from "../../context/LangContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { Avatar, Btn, TInput, Tag } from "../ui/index.jsx";
import { timeAgo } from "../../utils/helpers.js";
import { callAI } from "../../api/index.js";

export default function PostCard({ post, users, onLike, onComment, onOpenDetail }) {
  const { theme: T } = useTheme();
  const { t } = useLang();
  const { currentUser } = useAuth();
  const [showCmts, setShowCmts] = useState(false);
  const [cmtText, setCmtText]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const author = users?.find((u) => u.id === post.author_id) || {
    name: post.author_username,
    username: post.author_username,
    initials: (post.author_username || "?")[0].toUpperCase(),
  };
  const liked = post.liked || post.likes?.has?.(currentUser?.id) || false;

  const suggest = async () => {
    setAiLoading(true);
    const s = await callAI(`Post: "${post.content?.slice(0, 400)}"\n\nWrite a thoughtful 1-2 sentence reply. No emojis. Only the comment text.`);
    setCmtText(s.trim().replace(/^["']|["']$/g, ""));
    setAiLoading(false);
  };

  const submit = () => {
    if (!cmtText.trim()) return;
    onComment(post.id, cmtText.trim());
    setCmtText("");
  };

  return (
    <div className={post.isNew ? "new-post-anim fu" : "fu"}
      style={{
        background: T.surface, borderRadius: 12, marginBottom: 14, overflow: "hidden",
        border: `1px solid ${post.isNew ? T.accent + "50" : T.border}`,
      }}>

      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
          <Avatar name={author.name} initials={author.initials} size={40}
            online={author.is_online} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
              <div>
                <span style={{ fontWeight: 600, color: T.text, fontSize: 14 }}>{author.name}</span>
                <span style={{ color: T.muted, fontSize: 13, marginLeft: 6 }}>@{author.username}</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {post.isNew && (
                  <span style={{ background: T.accent + "20", color: T.accent, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                    {t("newBadge")}
                  </span>
                )}
                <span style={{ color: T.muted, fontSize: 12 }}>
                  {timeAgo(post.created_at ? new Date(post.created_at).getTime() : post.ts, t("justNow"))}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p onClick={() => onOpenDetail(post)} style={{ color: T.text, fontSize: 15, lineHeight: 1.75, whiteSpace: "pre-wrap", cursor: "pointer", marginBottom: post.image ? 14 : 0 }}>
          {post.content}
        </p>
      </div>

      {post.image && (
        <img src={post.image} alt="" onClick={() => onOpenDetail(post)}
          style={{ width: "100%", maxHeight: 340, objectFit: "cover", display: "block", cursor: "pointer" }} />
      )}

      <div style={{ padding: "12px 20px" }}>
        {post.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {post.tags.map((tk) => <Tag key={tk} label={tk} />)}
          </div>
        )}
        <div style={{ display: "flex", gap: 4, borderTop: `1px solid ${T.border}`, paddingTop: 12, flexWrap: "wrap" }}>
          {[
            { icon: liked ? "♥" : "♡", label: post.like_count ?? (post.likes?.size || 0), action: () => onLike(post.id), color: liked ? T.danger : T.muted },
            { icon: "💬", label: post.comment_count ?? post.comments?.length ?? 0, action: () => setShowCmts((s) => !s), color: T.muted },
            { icon: "↗", label: t("share"), action: () => {}, color: T.muted },
            { icon: "⤢", label: t("expand"), action: () => onOpenDetail(post), color: T.muted },
          ].map((x, i) => (
            <button key={i} type="button" onClick={x.action}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                borderRadius: 6, color: x.color, fontSize: 13, fontWeight: 500,
                background: "transparent", border: "none", cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = T.surface2}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize: 14 }}>{x.icon}</span><span>{x.label}</span>
            </button>
          ))}
        </div>

        {showCmts && (
          <div style={{ marginTop: 14 }}>
            {post.comments?.length > 0 && (
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {post.comments.map((c) => (
                  <div key={c.id || c._id} style={{ display: "flex", gap: 10, padding: "10px 12px", background: T.surface2, borderRadius: 8 }}>
                    <Avatar name={c.author_username} initials={(c.author_username || "?")[0].toUpperCase()} size={28} />
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{c.author_username}</span>
                        <span style={{ color: T.muted, fontSize: 11 }}>{timeAgo(new Date(c.created_at).getTime(), t("justNow"))}</span>
                      </div>
                      <p style={{ color: T.mutedLight, fontSize: 13, marginTop: 2, lineHeight: 1.5 }}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <Avatar name={currentUser?.name} initials={currentUser?.initials} size={32} />
              <div style={{ flex: 1 }}>
                <TInput value={cmtText} onChange={setCmtText} placeholder={t("writeComment")} style={{ fontSize: 13 }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Btn variant="subtle" onClick={suggest} loading={aiLoading} style={{ fontSize: 11, padding: "5px 10px" }}>{!aiLoading && "✦"} {t("aiSuggest")}</Btn>
                  <Btn onClick={submit} disabled={!cmtText.trim()} style={{ fontSize: 12, padding: "5px 12px" }}>{t("postBtn")}</Btn>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
