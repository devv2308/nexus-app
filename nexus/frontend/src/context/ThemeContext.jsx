import { createContext, useContext, useState, useEffect } from "react";

export const DARK = {
  bg:"#0d0b08", surface:"#161209", surface2:"#1d1810", border:"#2c2418",
  accent:"#c97a28", text:"#f2ede6", muted:"#7a6e60", mutedLight:"#a09080",
  success:"#4caf72", danger:"#d44", info:"#4a7fa5", live:"#dd4444",
};
export const LIGHT = {
  bg:"#f7f4ef", surface:"#ffffff", surface2:"#f0ebe3", border:"#ddd5c8",
  accent:"#c97a28", text:"#1a1510", muted:"#8a7f72", mutedLight:"#6a6058",
  success:"#4caf72", danger:"#d44", info:"#4a7fa5", live:"#dd4444",
};

const ThemeContext = createContext({ theme: DARK, isDark: true, toggleTheme: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("nexus_theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    localStorage.setItem("nexus_theme", isDark ? "dark" : "light");
    document.body.style.background = isDark ? DARK.bg : LIGHT.bg;
    document.body.style.color      = isDark ? DARK.text : LIGHT.text;
  }, [isDark]);

  const theme = isDark ? DARK : LIGHT;
  const toggleTheme = () => setIsDark((d) => !d);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setIsDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
