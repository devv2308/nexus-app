import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useLang } from "../../context/LangContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Spinner, PasswordInput } from "../ui/index.jsx";
import LangSelector from "../layout/LangSelector.jsx";

function StrengthBar({ password }) {
  const { theme: T } = useTheme();
  const s = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : password.length > 0 ? 1 : 0;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", T.danger, "#e08e36", T.success, T.success];
  if (!password) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= s ? colors[s] : T.border, transition: "background .3s" }} />
      ))}
      <span style={{ color: colors[s], fontSize: 11, minWidth: 38, fontWeight: 500 }}>{labels[s]}</span>
    </div>
  );
}

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const { t } = useLang();
  const { theme: T } = useTheme();

  const [mode, setMode]     = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  // Login fields
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // Signup fields
  const [name, setName]   = useState("");
  const [user, setUser]   = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw]       = useState("");
  const [pw2, setPw2]     = useState("");

  const switchMode = (m) => { setMode(m); setError(""); };

  const inputStyle = {
    width: "100%", background: T.surface2, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: "11px 14px", color: T.text, fontSize: 14,
    outline: "none", lineHeight: 1.5, boxSizing: "border-box",
  };
  const labelStyle = { color: T.muted, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPw) return setError(t("fillFields"));
    setLoading(true); setError("");
    try {
      await login({ username: loginId.trim(), password: loginPw });
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim() || !user.trim() || !pw) return setError(t("fillFields"));
    if (user.length < 3) return setError("Username must be at least 3 characters.");
    if (!/^[a-z0-9_]+$/.test(user)) return setError("Username: lowercase letters, numbers, underscores only.");
    if (email && !/\S+@\S+\.\S+/.test(email)) return setError("Please enter a valid email.");
    if (pw.length < 6) return setError("Password must be at least 6 characters.");
    if (pw !== pw2) return setError("Passwords do not match.");
    setLoading(true); setError("");
    try {
      const body = { name: name.trim(), username: user.toLowerCase().trim(), password: pw };
      if (email.trim()) body.email = email.trim();
      await signup(body);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "stretch", background: T.bg }}>

      {/* Left branding panel (desktop) */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", padding: 60,
        background: `linear-gradient(145deg,${T.surface} 0%,${T.bg} 100%)`,
        borderRight: `1px solid ${T.border}`, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", border: `1px solid ${T.accent}08`, top: -180, right: -180 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", border: `1px solid ${T.accent}10`, bottom: -100, left: -100 }} />
        <div style={{ position: "relative", textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 72, fontWeight: 700, color: T.text, letterSpacing: -3, marginBottom: 20 }}>
            nexus<span style={{ color: T.accent }}>.</span>
          </div>
          <p style={{ color: T.muted, fontSize: 17, lineHeight: 1.8 }}>{t("tagline")}</p>
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
            {[
              "Real-time chat — like WhatsApp, built in",
              "Live notifications for likes, comments & follows",
              "Connect with curious minds worldwide",
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />
                <span style={{ color: T.mutedLight, fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width: "100%", maxWidth: 460, margin: "0 auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 36px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 38, fontWeight: 700, color: T.text, letterSpacing: -1 }}>
            nexus<span style={{ color: T.accent }}>.</span>
          </div>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 6 }}>
            {mode === "login" ? t("signInContinue") : t("joinToday")}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: T.surface2, borderRadius: 10, padding: 3, marginBottom: 24 }}>
          {[["login", t("signIn")], ["register", t("register")]].map(([m, label]) => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", background: mode === m ? T.surface : "transparent",
                color: mode === m ? T.text : T.muted,
                border: mode === m ? `1px solid ${T.border}` : "none", transition: "all .2s",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: T.danger + "15", border: `1px solid ${T.danger}30`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8,
          }}>
            <span style={{ color: T.danger, fontSize: 16 }}>⚠</span>
            <p style={{ color: T.danger, fontSize: 13, lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        {/* Login form */}
        {mode === "login" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Username or Email</label>
              <input value={loginId} onChange={(e) => { setLoginId(e.target.value); setError(""); }}
                placeholder="Enter your username or email" autoComplete="username" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <PasswordInput value={loginPw} onChange={(v) => { setLoginPw(v); setError(""); }} placeholder="Enter your password" />
            </div>
            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: 13, borderRadius: 10,
                background: loading ? T.accent + "80" : T.accent,
                color: "#fff", fontSize: 15, fontWeight: 700, border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              {loading ? <><Spinner size={16} /> Signing in…</> : t("signInArrow")}
            </button>
          </form>
        )}

        {/* Signup form */}
        {mode === "register" && (
          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Your full name" autoComplete="name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Username *</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 14 }}>@</span>
                  <input value={user} onChange={(e) => { setUser(e.target.value.toLowerCase().replace(/\s/g, "")); setError(""); }}
                    placeholder="username" autoComplete="username"
                    style={{ ...inputStyle, paddingLeft: 26 }} />
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email <span style={{ color: T.muted, fontWeight: 400 }}>(optional)</span></label>
              <input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@example.com" type="email" autoComplete="email" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password *</label>
              <PasswordInput value={pw} onChange={(v) => { setPw(v); setError(""); }} placeholder="At least 6 characters" autoComplete="new-password" />
              <div style={{ marginTop: 6 }}><StrengthBar password={pw} /></div>
            </div>
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <PasswordInput value={pw2} onChange={(v) => { setPw2(v); setError(""); }} placeholder="Repeat your password" autoComplete="new-password" />
            </div>
            <p style={{ color: T.muted, fontSize: 11, lineHeight: 1.5 }}>By signing up, you agree to our Terms of Service and Privacy Policy.</p>
            <button type="submit" disabled={loading}
              style={{
                width: "100%", padding: 13, borderRadius: 10,
                background: loading ? T.accent + "80" : T.accent,
                color: "#fff", fontSize: 15, fontWeight: 700, border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
              {loading ? <><Spinner size={16} /> Creating account…</> : t("createArrow")}
            </button>
          </form>
        )}

        <div style={{ marginTop: 28, borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
          <LangSelector />
        </div>

        <p style={{ textAlign: "center", color: T.muted, fontSize: 13, marginTop: 18 }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => switchMode(mode === "login" ? "register" : "login")}
            style={{ color: T.accent, fontWeight: 600, cursor: "pointer" }}>
            {mode === "login" ? t("register") : t("signIn")}
          </span>
        </p>
      </div>
    </div>
  );
}
