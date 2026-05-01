import { createContext, useContext, useState, useEffect } from "react";
import { authApi, getToken, saveToken, clearToken } from "../api/index.js";

const AuthContext = createContext({
  currentUser: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  setCurrentUser: () => {},
});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);

  // Restore session on page load
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then((user) => setCurrentUser(user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async ({ username, password }) => {
    const data = await authApi.login({ username, password });
    saveToken(data.access_token);
    setCurrentUser(data.user);
    return data.user;
  };

  const signup = async (body) => {
    const data = await authApi.signup(body);
    saveToken(data.access_token);
    setCurrentUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearToken();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, signup, logout, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
