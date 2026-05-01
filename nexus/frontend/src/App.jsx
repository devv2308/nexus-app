import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext.jsx";
import { LangProvider, useLang } from "./context/LangContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { usePosts } from "./hooks/usePosts.js";
import { useChat } from "./hooks/useChat.js";
import { useNotifications } from "./hooks/useNotifications.js";
import { useUpload } from "./hooks/useUpload.js";
import { usersApi, communitiesApi, callAI } from "./api/index.js";

import AuthScreen from "./components/auth/AuthScreen.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import BottomNav from "./components/layout/BottomNav.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import DiscoverPage from "./pages/DiscoverPage.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AIPage from "./pages/AIPage.jsx";
import { Spinner, Toast, Modal, TInput, Btn, Avatar, Tag } from "./components/ui/index.jsx";
import { fmtNum } from "./utils/helpers.js";

const defaultPrivacy = {
  lastSeen: "everyone",
  onlineStatus: "everyone",
  readReceipts: true,
  chatHistory: "keep",
  blockedUsers: [],
  wallpaper: "none",
  hideStatusFrom: [],
};

function normalizeSettings(settings = {}) {
  return {
    lastSeen: settings.last_seen ?? defaultPrivacy.lastSeen,
    onlineStatus: settings.online_status ?? defaultPrivacy.onlineStatus,
    readReceipts: settings.read_receipts ?? defaultPrivacy.readReceipts,
    chatHistory: settings.chat_history ?? defaultPrivacy.chatHistory,
    blockedUsers: settings.blockedUsers ?? defaultPrivacy.blockedUsers,
    wallpaper: settings.chat_wallpaper ?? defaultPrivacy.wallpaper,
    hideStatusFrom: settings.hide_status_from ?? defaultPrivacy.hideStatusFrom,
  };
}

function serializeSettings(privacy) {
  return {
    last_seen: privacy.lastSeen,
    online_status: privacy.onlineStatus,
    read_receipts: privacy.readReceipts,
    chat_history: privacy.chatHistory,
    chat_wallpaper: privacy.wallpaper,
    hide_status_from: privacy.hideStatusFrom,
  };
}

// ── Global CSS ────────────────────────────────────────────────────────────────
const _css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%;min-height:100vh}
  body{font-family:'DM Sans',sans-serif;background:#0d0b08;color:#f2ede6}
  input,textarea,button,select{font-family:'DM Sans',sans-serif}
  button{cursor:pointer;border:none;background:none;outline:none}
  textarea{resize:none;outline:none}
  input{outline:none}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-thumb{background:#2c2418;border-radius:2px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes toast{0%{opacity:0;transform:translateX(-50%) translateY(10px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}85%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(10px)}}
  @keyframes newPost{from{opacity:0;transform:scaleY(.9) translateY(-6px);transform-origin:top}to{opacity:1;transform:scaleY(1) translateY(0)}}
  .fu{animation:fadeUp .3s ease both}
  .su{animation:slideUp .4s cubic-bezier(.16,1,.3,1) both}
  .toast-anim{animation:toast 3s ease forwards}
  .new-post-anim{animation:newPost .4s cubic-bezier(.16,1,.3,1) both}
  @media(max-width:960px){.sidebar-right{display:none!important}}
  @media(max-width:640px){.sidebar-left{display:none!important}.main-pad{padding:16px 12px!important}.bottom-nav{display:flex!important}}
`;
if (!document.getElementById("nexus-styles")) {
  const el  = document.createElement("style");
  el.id     = "nexus-styles";
  el.textContent = _css;
  document.head.appendChild(el);
}

// ── Create Post Modal ─────────────────────────────────────────────────────────
function CreateModal({ onPost, onClose }) {
  const { theme: T }            = useTheme();
  const { t }                   = useLang();
  const { currentUser }         = useAuth();
  const { upload, uploading }   = useUpload();

  const [content, setContent]   = useState("");
  const [tagsStr, setTagsStr]   = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [imagePreview, setPreview] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoad]  = useState(false);
  const [showAI, setShowAI]     = useState(false);

  const generate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoad(true);
    const txt = await callAI(
      `Write a thoughtful, engaging post for a professional community about: "${aiPrompt}"\n\nRequirements: 2–4 sentences, conversational yet insightful, no hashtags or emojis, start directly with content.\n\nRespond with ONLY the post text.`
    );
    setContent(txt.trim().replace(/^["']|["']$/g, ""));
    setAiLoad(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    // Upload to server
    const url = await upload(file);
    if (url) setImageUrl(url);
  };

  const submit = () => {
    if (!content.trim()) return;
    const tags = tagsStr.split(",").map((tk) => tk.trim().replace(/^#/, "")).filter(Boolean);
    // Use server URL if uploaded, fall back to base64 preview for offline demo
    onPost(content.trim(), tags, imageUrl || imagePreview);
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 20, fontWeight: 400, color: T.text }}>{t("newPostTitle")}</h3>
        <button type="button" onClick={onClose} style={{ color: T.muted, fontSize: 22 }}>×</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
        <Avatar name={currentUser?.name} initials={currentUser?.initials} size={40} />
        <div>
          <p style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>{currentUser?.name}</p>
          <p style={{ color: T.muted, fontSize: 12 }}>@{currentUser?.username}</p>
        </div>
      </div>

      <TInput value={content} onChange={setContent}
        placeholder={`${t("whatsOnMind")}?`} multiline rows={4}
        style={{ marginBottom: 12, fontSize: 15 }} />

      {(imagePreview || imageUrl) && (
        <div style={{ position: "relative", marginBottom: 12 }}>
          <img src={imagePreview || imageUrl} alt=""
            style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, border: `1px solid ${T.border}` }} />
          {uploading && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10 }}>
              <Spinner size={24} />
            </div>
          )}
          {!uploading && (
            <button type="button" onClick={() => { setImageUrl(null); setPreview(null); }}
              style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.7)", color: "#fff", borderRadius: "50%", width: 28, height: 28, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ×
            </button>
          )}
        </div>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 10, border: `1.5px dashed ${T.border}`, color: T.muted, fontSize: 13, cursor: "pointer", marginBottom: 12 }}>
        {uploading ? <><Spinner size={13} /> Uploading…</> : <>📎 {t("uploadImage")}</>}
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} disabled={uploading} />
      </label>

      <TInput value={tagsStr} onChange={setTagsStr}
        placeholder={t("tagsPlaceholder")} style={{ marginBottom: 14, fontSize: 13 }} />

      {/* AI Writing Assistant */}
      <button type="button" onClick={() => setShowAI((s) => !s)}
        style={{ width: "100%", padding: "10px 14px", background: T.accent + "10", border: `1px solid ${T.accent}20`, borderRadius: 8, color: T.accent, fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span>✦ {t("aiAssistant")}</span>
        <span style={{ opacity: 0.6 }}>{showAI ? "▲" : "▼"}</span>
      </button>
      {showAI && (
        <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
          <p style={{ color: T.muted, fontSize: 12, marginBottom: 10 }}>{t("describeTopicAI")}</p>
          <TInput value={aiPrompt} onChange={setAiPrompt} placeholder={t("aiPromptPlaceholder")} />
          <Btn onClick={generate} loading={aiLoading} style={{ marginTop: 10, fontSize: 12 }}>
            {!aiLoading && "✦"} {t("generateDraft")}
          </Btn>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>{t("cancel")}</Btn>
        <Btn onClick={submit} disabled={!content.trim() || uploading}>{t("publish")}</Btn>
      </div>
    </Modal>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
function AppShell() {
  const { currentUser, loading: authLoading } = useAuth();
  const { theme: T, isDark, setIsDark }        = useTheme();
  const { t }                                  = useLang();

  const { posts, loadFeed, addPost, toggleLike, addComment }                       = usePosts();
  const { convos, messages, typingMap, loadConvos, loadMessages, openSocket,
          sendMessage, sendTyping, startConversation }                              = useChat();
  const { notifs, unreadCount: unreadNotifs, load: loadNotifs, markAll, markOne, disconnect: disconnectNotifs }  = useNotifications();

  const [users, setUsers]             = useState([]);
  const [communities, setCommunities] = useState([]);
  const [screen, setScreen]           = useState("feed");
  const [profileUser, setProfileUser] = useState(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [toast, setToast]             = useState({ msg: "", type: "success" });
  const [privacy, setPrivacy]         = useState(defaultPrivacy);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3100);
  };

  useEffect(() => {
    if (!currentUser) {
      disconnectNotifs();
      setUsers([]);
      setCommunities([]);
      setScreen("feed");
      setProfileUser(null);
      setShowCreate(false);
      setToast({ msg: "", type: "success" });
      setPrivacy(defaultPrivacy);
      return;
    }

    setScreen("feed");
    setProfileUser(null);
    loadFeed();
    loadConvos();
    loadNotifs();
    usersApi.search("", 50).then(setUsers).catch(() => {});
    communitiesApi.list().then(setCommunities).catch(() => {});
    Promise.all([
      usersApi.getSettings().catch(() => null),
      usersApi.getBlocked().catch(() => []),
    ]).then(([settings, blocked]) => {
      const nextPrivacy = {
        ...defaultPrivacy,
        ...normalizeSettings(settings || {}),
        blockedUsers: blocked.map((user) => user.id),
      };
      setPrivacy(nextPrivacy);
      if (settings?.theme) setIsDark(settings.theme === "dark");
    }).catch(() => {});
  }, [currentUser?.id, disconnectNotifs]);

  const unreadDMs = convos.reduce((a, c) => a + (c.unread_count > 0 ? 1 : 0), 0);

  const handleAddPost = async (content, tags, image) => {
    try { await addPost(content, tags, image); setShowCreate(false); notify(t("published")); }
    catch (e) { notify(e.message, "error"); }
  };

  const handleLike    = async (id)        => { try { await toggleLike(id); } catch {} };
  const handleComment = async (id, text)  => { try { await addComment(id, text); notify(t("commentPosted")); } catch {} };

  const handlePrivacy = async (upd) => {
    setPrivacy(upd);
    try {
      await usersApi.updateSettings(serializeSettings(upd));
    } catch {}
  };

  const handleThemeChange = async (nextIsDark) => {
    setIsDark(nextIsDark);
    try {
      await usersApi.updateSettings({ theme: nextIsDark ? "dark" : "light" });
    } catch {}
  };

  const handleToggleBlock = async (userId) => {
    try {
      const res = await usersApi.toggleBlock(userId);
      setPrivacy((prev) => ({
        ...prev,
        blockedUsers: res.blocked
          ? [...prev.blockedUsers, userId]
          : prev.blockedUsers.filter((id) => id !== userId),
      }));
    } catch {}
  };

  const handleFollow = async (userId) => {
    try {
      const res = await usersApi.toggleFollow(userId);
      setProfileUser((p) => {
        if (!p || p.id !== userId) return p;
        const followers = new Set(p.followers || []);
        if (res.following) followers.add(currentUser.id);
        else followers.delete(currentUser.id);
        return {
          ...p,
          is_following: res.following,
          followers: [...followers],
          follower_count: followers.size,
        };
      });
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const followers = new Set(u.followers || []);
          if (res.following) followers.add(currentUser.id);
          else followers.delete(currentUser.id);
          return {
            ...u,
            is_following: res.following,
            followers: [...followers],
            follower_count: followers.size,
          };
        })
      );
    } catch {}
  };

  const goProfile = (user) => { setProfileUser(user); setScreen("profile"); };

  const handleSetScreen = (s) => {
    if (s === "profile") goProfile(currentUser);
    else setScreen(s);
  };

  if (authLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg, flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "'Georgia',serif", fontSize: 32, fontWeight: 700, color: T.text }}>
          nexus<span style={{ color: T.accent }}>.</span>
        </div>
        <Spinner size={24} />
      </div>
    );
  }

  if (!currentUser) return <AuthScreen />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, position: "relative" }}>

      <Sidebar
        screen={screen} setScreen={setScreen}
        setShowCreate={setShowCreate}
        unreadNotifs={unreadNotifs} unreadDMs={unreadDMs}
        onGoProfile={goProfile}
      />

      {/* Main content */}
      <div className="main-pad" style={{ flex: 1, overflowY: "auto", padding: "26px 26px", maxWidth: 700 }}>
        {screen === "feed"          && <FeedPage posts={posts} users={users} onLike={handleLike} onComment={handleComment} onOpenCreate={() => setShowCreate(true)} onOpenDetail={() => {}} />}
        {screen === "discover"      && <DiscoverPage communities={communities} onToggle={async (id) => {
          const r = await communitiesApi.toggleJoin(id);
          setCommunities((prev) => prev.map((c) => c.id !== id ? c : { ...c, joined: r.joined, member_count: (c.member_count || 0) + (r.joined ? 1 : -1) }));
        }} />}
        {screen === "messages"      && <MessagesPage convos={convos} users={users} messages={messages} typingMap={typingMap} onSend={sendMessage} onSendTyping={sendTyping} onNewConvo={startConversation} onLoadMessages={loadMessages} onOpenSocket={openSocket} wallpaper={privacy.wallpaper} readReceipts={privacy.readReceipts} />}
        {screen === "notifications" && <NotificationsPage notifs={notifs} users={users} onMarkAll={markAll} onMarkOne={markOne} />}
        {screen === "ai"            && <AIPage />}
        {screen === "profile"       && profileUser && <ProfilePage user={profileUser} posts={posts} users={users} onLike={handleLike} onComment={handleComment} onOpenDetail={() => {}} isOwn={profileUser.id === currentUser.id} privacy={privacy} onPrivacyChange={handlePrivacy} onToggleBlock={handleToggleBlock} onThemeChange={handleThemeChange} isDark={isDark} onFollow={handleFollow} />}
      </div>

      {/* Right sidebar */}
      <div className="sidebar-right" style={{ width: 236, borderLeft: `1px solid ${T.border}`, padding: 18, position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
        <h4 style={{ color: T.text, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>{t("myCommunities")}</h4>
        {communities.filter((c) => c.joined).map((c) => (
          <div key={c.id} onClick={() => setScreen("discover")} style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 9, cursor: "pointer", padding: "6px 8px", borderRadius: 8 }}
            onMouseEnter={(e) => e.currentTarget.style.background = T.surface2}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 17 }}>{c.icon}</span>
            <div>
              <p style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>{c.name}</p>
              <p style={{ color: T.muted, fontSize: 11 }}>{fmtNum(c.member_count || 0)} {t("members")}</p>
            </div>
          </div>
        ))}
        {!communities.some((c) => c.joined) && <p style={{ color: T.muted, fontSize: 12, marginBottom: 14 }}>{t("joinHint")}</p>}

        {/* AI shortcut card */}
        <div style={{ borderTop: `1px solid ${T.border}`, margin: "14px 0" }} />
        <div onClick={() => setScreen("ai")} style={{ background: `linear-gradient(135deg,${T.accent}15,${T.info}10)`, border: `1px solid ${T.accent}25`, borderRadius: 12, padding: 14, cursor: "pointer", marginBottom: 14 }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = T.accent + "50"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = T.accent + "25"}>
          <p style={{ color: T.accent, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>✦ Nexus AI</p>
          <p style={{ color: T.muted, fontSize: 12, lineHeight: 1.5 }}>Write posts, get ideas, translate text and more.</p>
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, margin: "14px 0" }} />
        <h4 style={{ color: T.text, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>{t("people")}</h4>
        {users.filter((u) => u.id !== currentUser.id).slice(0, 8).map((u) => (
          <div key={u.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 9, padding: "5px 8px", borderRadius: 8, justifyContent: "space-between" }}
            onMouseEnter={(e) => e.currentTarget.style.background = T.surface2}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", flex: 1 }} onClick={() => goProfile(u)}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.surface2, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: T.accent }}>{(u.initials || u.name?.[0] || "?").slice(0,2)}</div>
                {u.is_online && <span style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: T.success, border: `1.5px solid ${T.bg}` }} />}
              </div>
              <div>
                <p style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>{u.name}</p>
              </div>
            </div>
            <button type="button" onClick={() => startConversation(u.id).then(() => setScreen("messages"))}
              style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 5, padding: "2px 8px", color: T.muted, fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
              {t("dm")}
            </button>
          </div>
        ))}

        <div style={{ borderTop: `1px solid ${T.border}`, margin: "14px 0" }} />
        <h4 style={{ color: T.text, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{t("trending")}</h4>
        {["AI", "design", "dev", "philosophy", "UX", "research"].map((tk) => (
          <span key={tk} style={{ display: "inline-block", marginRight: 6, marginBottom: 6 }}><Tag label={tk} /></span>
        ))}
      </div>

      <BottomNav screen={screen} setScreen={handleSetScreen} unreadNotifs={unreadNotifs} unreadDMs={unreadDMs} />

      {showCreate && <CreateModal onPost={handleAddPost} onClose={() => setShowCreate(false)} />}
      <Toast message={toast.msg} type={toast.type} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
