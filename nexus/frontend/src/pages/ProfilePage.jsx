import { useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useLang } from "../context/LangContext.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { Avatar, Btn, Toggle, RadioGroup, SectionLabel, SettingRow } from "../components/ui/index.jsx";
import PostCard from "../components/feed/PostCard.jsx";
import { fmtNum } from "../utils/helpers.js";
import { usersApi } from "../api/index.js";

const WALLPAPERS = [
  { id: "none",  label: "None"      },
  { id: "dots",  label: "Dots"      },
  { id: "grid",  label: "Grid"      },
  { id: "waves", label: "Waves"     },
  { id: "geo",   label: "Geometric" },
];

export default function ProfilePage({
  user, posts, users,
  onLike, onComment, onOpenDetail,
  isOwn, privacy, onPrivacyChange,
  onToggleBlock,
  onThemeChange, isDark,
  onFollow,
}) {
  const { theme: T } = useTheme();
  const { t } = useLang();
  const { currentUser } = useAuth();

  const [editingBio, setEditingBio]     = useState(false);
  const [bioText, setBioText]           = useState(user?.bio || "");
  const [settingsTab, setSettingsTab]   = useState("privacy");
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [savingBio, setSavingBio]       = useState(false);

  const myPosts  = posts.filter((p) => p.author_id === user?.id);
  const others   = users.filter((u) => u.id !== currentUser?.id);

  const saveBio = async () => {
    setSavingBio(true);
    try { await usersApi.updateProfile({ bio: bioText }); } catch { /* ignore */ }
    setSavingBio(false);
    setEditingBio(false);
  };

  const TABS = [
    { id: "privacy",    icon: "🔒", label: "Privacy" },
    { id: "appearance", icon: "🎨", label: "Appearance" },
    { id: "advanced",   icon: "⚡",  label: "Advanced" },
  ];
  const visOpts  = [{ value: "everyone", label: "Everyone" }, { value: "contacts", label: "Contacts" }, { value: "nobody", label: "Nobody" }];
  const histOpts = [{ value: "keep", label: "Keep all" }, { value: "30days", label: "30 days" }, { value: "7days", label: "7 days" }, { value: "delete", label: "Delete on exit" }];

  if (!user) return null;

  return (
    <div>
      {/* Profile card */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ height: 80, background: `linear-gradient(135deg,${T.accent}30,transparent)` }} />
        <div style={{ padding: "0 24px 24px", marginTop: -40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", border: `3px solid ${T.bg}`, boxShadow: `0 0 0 2px ${T.accent}50`, display: "flex", alignItems: "center", justifyContent: "center", background: T.surface2 }}>
              <Avatar name={user.name} initials={user.initials} size={80} online={user.is_online} />
            </div>
            {isOwn ? (
              editingBio ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" onClick={() => setEditingBio(false)} style={{ fontSize: 12 }}>Cancel</Btn>
                  <Btn onClick={saveBio} loading={savingBio} style={{ fontSize: 12 }}>Save</Btn>
                </div>
              ) : (
                <button type="button" onClick={() => setEditingBio(true)}
                  style={{ padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 500, background: "transparent", color: T.text, border: `1px solid ${T.border}`, cursor: "pointer" }}>
                  Edit profile
                </button>
              )
            ) : (
              <Btn onClick={() => onFollow?.(user.id)}
                variant={user.is_following ? "ghost" : "primary"}>
                {user.is_following ? "Following" : t("follow")}
              </Btn>
            )}
          </div>

          <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{user.name}</h2>
          <p style={{ color: T.muted, fontSize: 13, marginBottom: 10 }}>@{user.username}</p>

          {editingBio ? (
            <textarea value={bioText} onChange={(e) => setBioText(e.target.value)} rows={3}
              style={{ width: "100%", background: T.surface2, border: `1px solid ${T.accent}50`, borderRadius: 8, padding: "9px 12px", color: T.text, fontSize: 14, lineHeight: 1.6, resize: "none", outline: "none", marginBottom: 12 }} />
          ) : (
            <p style={{ color: T.mutedLight, fontSize: 14, lineHeight: 1.65, marginBottom: 16 }}>{bioText || user.bio || <span style={{ color: T.muted, fontStyle: "italic" }}>No bio yet.</span>}</p>
          )}

          {/* Stats bar */}
          <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
            {[
              [t("followers"), fmtNum(user.followers?.length || user.follower_count || 0)],
              [t("following"), fmtNum(user.following?.length || user.following_count || 0)],
              ["Posts", myPosts.length],
            ].map(([label, val], i, arr) => (
              <div key={label} style={{ flex: 1, textAlign: "center", borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ color: T.text, fontWeight: 700, fontSize: 20 }}>{val}</div>
                <div style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings (own profile) */}
      {isOwn && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>⚙️</span>
            <h3 style={{ color: T.text, fontSize: 16, fontWeight: 600 }}>Settings</h3>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, background: T.surface2, borderRadius: 10, padding: 4 }}>
            {TABS.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setSettingsTab(tab.id)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 6px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                  fontWeight: settingsTab === tab.id ? 600 : 400,
                  background: settingsTab === tab.id ? T.surface : "transparent",
                  color: settingsTab === tab.id ? T.accent : T.muted,
                  border: settingsTab === tab.id ? `1px solid ${T.border}` : "none",
                }}>
                <span style={{ fontSize: 14 }}>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Privacy tab */}
          {settingsTab === "privacy" && (
            <div>
              <SectionLabel label="Visibility" />
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "0 16px" }}>
                <SettingRow icon="👁" title="Last seen" subtitle="Who can see when you were last active"
                  right={<RadioGroup options={visOpts} value={privacy.lastSeen} onChange={(v) => onPrivacyChange({ ...privacy, lastSeen: v })} />} />
                <SettingRow icon="🟢" title="Online status" subtitle="Who can see when you're online"
                  right={<RadioGroup options={visOpts} value={privacy.onlineStatus} onChange={(v) => onPrivacyChange({ ...privacy, onlineStatus: v })} />} />
                <SettingRow icon="✔✔" title="Read receipts" subtitle="Show double-tick when messages are read"
                  right={<Toggle on={privacy.readReceipts} onChange={(v) => onPrivacyChange({ ...privacy, readReceipts: v })} />} />
              </div>
              <SectionLabel label="Blocked Users" />
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "0 16px" }}>
                <SettingRow icon="🚫" title="Blocked users"
                  subtitle={privacy.blockedUsers?.length === 0 ? "No one blocked" : `${privacy.blockedUsers?.length} blocked`}
                  right={<button type="button" onClick={() => setShowBlockPicker((s) => !s)} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: T.accent + "18", color: T.accent, border: `1px solid ${T.accent}30`, cursor: "pointer" }}>{showBlockPicker ? "Done" : "Manage"}</button>} />
                {showBlockPicker && (
                  <div style={{ paddingBottom: 12 }}>
                    {others.map((u) => {
                      const blocked = privacy.blockedUsers?.includes(u.id);
                      return (
                        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${T.border}22` }}>
                          <Avatar name={u.name} initials={u.initials} size={34} />
                          <div style={{ flex: 1 }}>
                            <p style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>{u.name}</p>
                            <p style={{ color: T.muted, fontSize: 11 }}>@{u.username}</p>
                          </div>
                          <button type="button"
                            onClick={() => onToggleBlock?.(u.id)}
                            style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", background: blocked ? T.danger + "18" : "transparent", color: blocked ? T.danger : T.muted, border: `1px solid ${blocked ? T.danger + "40" : T.border}` }}>
                            {blocked ? "Unblock" : "Block"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <SectionLabel label="Chat" />
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "0 16px" }}>
                <SettingRow icon="🗂" title="Chat history" subtitle="How long to retain messages"
                  right={<RadioGroup options={histOpts} value={privacy.chatHistory} onChange={(v) => onPrivacyChange({ ...privacy, chatHistory: v })} />} />
              </div>
            </div>
          )}

          {/* Appearance tab */}
          {settingsTab === "appearance" && (
            <div>
              <SectionLabel label="Theme" />
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "0 16px" }}>
                <SettingRow icon={isDark ? "🌙" : "☀️"} title="Color theme" subtitle={isDark ? "Dark mode is active" : "Light mode is active"}
                  right={<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: T.muted, fontSize: 12 }}>☀️</span>
                    <Toggle on={isDark} onChange={onThemeChange} />
                    <span style={{ color: T.muted, fontSize: 12 }}>🌙</span>
                  </div>} />
              </div>
              <SectionLabel label="Chat Wallpaper" />
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {WALLPAPERS.map((w) => (
                    <button key={w.id} type="button" onClick={() => onPrivacyChange({ ...privacy, wallpaper: w.id })}
                      style={{ position: "relative", height: 70, borderRadius: 10, border: `2px solid ${privacy.wallpaper === w.id ? T.accent : T.border}`, background: T.surface2, cursor: "pointer", overflow: "hidden" }}>
                      <p style={{ color: T.text, fontSize: 11, fontWeight: 600, position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center" }}>{w.label}</p>
                      {privacy.wallpaper === w.id && <div style={{ position: "absolute", top: 5, right: 5, width: 16, height: 16, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>✓</div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced tab */}
          {settingsTab === "advanced" && (
            <div>
              <SectionLabel label="Hide Online Status From" />
              <p style={{ color: T.muted, fontSize: 12, marginBottom: 12 }}>These users won't see your online status.</p>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "0 16px" }}>
                {others.map((u, idx) => {
                  const hidden = privacy.hideStatusFrom?.includes(u.id);
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: idx < others.length - 1 ? `1px solid ${T.border}22` : "none" }}>
                      <Avatar name={u.name} initials={u.initials} size={36} />
                      <div style={{ flex: 1 }}>
                        <p style={{ color: T.text, fontSize: 14, fontWeight: 500 }}>{u.name}</p>
                        <p style={{ color: T.muted, fontSize: 12 }}>@{u.username}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {hidden && <span style={{ background: T.danger + "18", color: T.danger, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>Hidden</span>}
                        <Toggle on={!hidden}
                          onChange={() => {
                            const next = hidden
                              ? privacy.hideStatusFrom.filter((x) => x !== u.id)
                              : [...(privacy.hideStatusFrom || []), u.id];
                            onPrivacyChange({ ...privacy, hideStatusFrom: next });
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Posts grid */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600 }}>Posts</h3>
        <span style={{ background: T.surface2, color: T.muted, fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 10 }}>{myPosts.length}</span>
      </div>
      {myPosts.length === 0 ? (
        <div style={{ textAlign: "center", color: T.muted, padding: 48, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          {t("noPosts")}
        </div>
      ) : (
        myPosts.map((p) => (
          <PostCard key={p.id} post={p} users={users} onLike={onLike} onComment={onComment} onOpenDetail={onOpenDetail} />
        ))
      )}
    </div>
  );
}
