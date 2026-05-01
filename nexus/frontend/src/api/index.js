/**
 * src/api/index.js
 * Central API client. All HTTP + WebSocket calls live here.
 * Vite dev-server proxies /api/* → http://localhost:8000
 */

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken   = ()    => localStorage.getItem("nexus_token");
export const saveToken  = (tok) => localStorage.setItem("nexus_token", tok);
export const clearToken = ()    => localStorage.removeItem("nexus_token");

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`/api${path}`, { ...options, headers });
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
        ? data.detail.map((e) => e.msg).join(", ")
        : `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const get   = (path)        => request(path, { method: "GET" });
const post  = (path, body)  => request(path, { method: "POST",  body: JSON.stringify(body) });
const patch = (path, body)  => request(path, { method: "PATCH", body: JSON.stringify(body) });
const del   = (path)        => request(path, { method: "DELETE" });

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (body) => post("/auth/signup", body),
  login:  (body) => post("/auth/login",  body),
  logout: ()     => post("/auth/logout", {}),
  me:     ()     => get("/auth/me"),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  search:         (q = "", limit = 30) => get(`/users/?q=${encodeURIComponent(q)}&limit=${limit}`),
  getByUsername:  (username)           => get(`/users/${username}`),
  updateProfile:  (body)               => patch("/users/me/profile", body),
  getSettings:    ()                   => get("/users/me/settings"),
  updateSettings: (body)               => patch("/users/me/settings", body),
  toggleFollow:   (userId)             => post(`/users/${userId}/follow`, {}),
  toggleBlock:    (targetId)           => post("/users/me/block", { target_user_id: targetId }),
  getBlocked:     ()                   => get("/users/me/blocked"),
};

// ── Posts ─────────────────────────────────────────────────────────────────────
export const postsApi = {
  feed:          (page = 1)            => get(`/posts/feed?page=${page}`),
  list:          (page = 1, tag = "")  => get(`/posts/?page=${page}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`),
  getById:       (id)                  => get(`/posts/${id}`),
  create:        (body)                => post("/posts/", body),
  update:        (id, body)            => patch(`/posts/${id}`, body),
  delete:        (id)                  => del(`/posts/${id}`),
  toggleLike:    (id)                  => post(`/posts/${id}/like`, {}),
  addComment:    (id, text)            => post(`/posts/${id}/comments`, { text }),
  deleteComment: (postId, commentId)   => del(`/posts/${postId}/comments/${commentId}`),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatApi = {
  listConversations: ()            => get("/chat/conversations"),
  startConversation: (pid)         => post("/chat/conversations", { participant_id: pid }),
  getMessages:       (cid, page=1) => get(`/chat/conversations/${cid}/messages?page=${page}`),
  sendMessage:       (cid, text)   => post(`/chat/conversations/${cid}/messages`, { text }),

  /**
   * Open a real-time WebSocket for a conversation.
   * Returns { send(text), sendTyping(), close(), socket }
   */
  openSocket: (conversationId, { onMessage, onOpen, onClose, onError } = {}) => {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");
    // Use wss in production; ws in dev (Vite proxies /api WS too)
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${location.host}/api/chat/ws/${conversationId}?token=${token}`;
    const socket = new WebSocket(url);

    socket.onopen    = () => onOpen?.();
    socket.onclose   = () => onClose?.();
    socket.onerror   = (e) => onError?.(e);
    socket.onmessage = (e) => {
      try { onMessage?.(JSON.parse(e.data)); } catch { /* ignore */ }
    };

    return {
      send:        (text) => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ text })),
      sendTyping:  ()     => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ event: "typing" })),
      close:       ()     => socket.close(),
      socket,
    };
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:        ()   => get("/notifications/"),
  unreadCount: ()   => get("/notifications/unread-count"),
  markAll:     ()   => post("/notifications/read-all", {}),
  markOne:     (id) => post(`/notifications/${id}/read`, {}),
};

/**
 * Open a persistent notification WebSocket.
 * Returns { close() }
 */
export function openNotifSocket({ onMessage, onClose } = {}) {
  const token = getToken();
  if (!token) return { close: () => {} };
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const url = `${protocol}://${location.host}/api/notifications/ws?token=${token}`;
  const socket = new WebSocket(url);

  // Heartbeat every 30 s to keep the connection alive through proxies
  let pingInterval = null;
  socket.onopen = () => {
    pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send("ping");
    }, 30_000);
  };
  socket.onclose = () => {
    clearInterval(pingInterval);
    onClose?.();
  };
  socket.onmessage = (e) => {
    if (e.data === "pong") return;
    try { onMessage?.(JSON.parse(e.data)); } catch { /* ignore */ }
  };

  return { close: () => socket.close(), socket };
}

// ── Communities ───────────────────────────────────────────────────────────────
export const communitiesApi = {
  list:       (q="") => get(`/communities/${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  create:     (body) => post("/communities/", body),
  toggleJoin: (id)   => post(`/communities/${id}/join`, {}),
};

// ── AI (Anthropic via Vite proxy) ─────────────────────────────────────────────
export async function callAI(prompt) {
  if (!prompt?.trim()) return "";
  try {
    const data = await aiApi.chat([{ role: "user", content: prompt }]);
    return data.reply || "";
  } catch {
    return "";
  }
}

// ── Uploads ───────────────────────────────────────────────────────────────────
export const uploadsApi = {
  /**
   * Upload an image file and return its public URL.
   * Use useUpload() hook instead for progress/error state in components.
   */
  image: async (file) => {
    const fd  = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads/image", {
      method:  "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body:    fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Upload failed (${res.status})`);
    return data.url;
  },
};

// ── AI Chat ───────────────────────────────────────────────────────────────────
export const aiApi = {
  /** Send full conversation history; returns { reply, model, usage } */
  chat: (messages, system) => post("/ai/chat", { messages, ...(system ? { system } : {}) }),
  /** Returns { enabled, model, demo_mode } */
  status: () => get("/ai/status"),
};
