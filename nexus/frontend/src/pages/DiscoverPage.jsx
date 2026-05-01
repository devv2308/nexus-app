import { useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useLang } from "../context/LangContext.jsx";
import { TInput } from "../components/ui/index.jsx";

export default function DiscoverPage({ communities, onToggle }) {
  const { theme: T } = useTheme();
  const { t } = useLang();
  const [search, setSearch] = useState("");

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 24, fontWeight: 300, color: T.text, marginBottom: 4 }}>{t("discoverTitle")}</h2>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>{t("discoverSub")}</p>
      <TInput value={search} onChange={setSearch} placeholder={t("searchComm")} style={{ marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
        {filtered.map((c) => (
          <div key={c.id} className="fu" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 28 }}>{c.icon}</div>
            <div>
              <h3 style={{ color: T.text, fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{c.name}</h3>
              <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.5 }}>{c.description}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
              <span style={{ color: T.mutedLight, fontSize: 12 }}>{c.member_count || 0} {t("members")}</span>
              <button type="button" onClick={() => onToggle(c.id)}
                style={{
                  padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  background: c.joined ? "transparent" : T.accent,
                  color: c.joined ? T.mutedLight : "#fff",
                  border: c.joined ? `1px solid ${T.border}` : "none",
                }}>
                {c.joined ? t("joined") : t("join")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
