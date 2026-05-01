import { useLang } from "../../context/LangContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function LangSelector() {
  const { lang, setLang, LANGS } = useLang();
  const { theme: T } = useTheme();
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "6px 0" }}>
      {LANGS.map(({ code, flag, label }) => (
        <button key={code} type="button" onClick={() => setLang(code)}
          style={{
            background: lang === code ? T.accent + "20" : "transparent",
            color: lang === code ? T.accent : T.muted,
            border: `1px solid ${lang === code ? T.accent + "50" : T.border}`,
            borderRadius: 6, padding: "3px 8px", fontSize: 11,
            cursor: "pointer", fontWeight: lang === code ? 600 : 400,
          }}>
          {flag} {label}
        </button>
      ))}
    </div>
  );
}
