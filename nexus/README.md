# nexus.

> A modern, AI-powered social + messaging platform. Instagram × WhatsApp × ChatGPT.

---

## ✨ Features

| Category | What's included |
|----------|----------------|
| **Auth** | JWT signup/login, password strength meter, session restore |
| **Feed** | Posts, likes, comments, image uploads, AI writing assistant |
| **Chat** | Real-time WebSocket DMs, typing indicators, read receipts, chat wallpapers |
| **Notifications** | WebSocket push for likes, comments, follows, DMs — instant bell badge |
| **AI Chat** | ChatGPT-style page powered by `/api/ai/chat` (OpenAI or demo mode) |
| **Discover** | Communities with join/leave, member counts |
| **Profile** | Bio editing, follow/unfollow, privacy settings, theme toggle |
| **Mobile** | Responsive layout, bottom nav, accessible on LAN via phone |

---

## 🛠 Tech Stack

```
Frontend  React 18 + Vite 5  (port 3000)
Backend   FastAPI + Python 3.11+  (port 8000)
Database  MongoDB (Motor async driver)
AI        OpenAI gpt-4o-mini  (optional — demo mode if no key)
Realtime  WebSocket (FastAPI native)
Auth      JWT (python-jose + passlib bcrypt)
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+ (`python --version`)
- Node.js 18+ (`node --version`)
- MongoDB running locally (`mongod`)

### Windows (double-click or run from cmd)
```bat
start-backend.bat      ← Terminal 1
start-frontend.bat     ← Terminal 2
```

### macOS / Linux
```bash
# Terminal 1 — Backend
./start-backend.sh

# Terminal 2 — Frontend
./start-frontend.sh
```

Then open **http://localhost:3000** in your browser.

---

## 📱 Mobile Access (Same Wi-Fi)

1. Find your PC's LAN IP:
   - **Windows:** `ipconfig` → look for IPv4 Address (e.g. `192.168.1.10`)
   - **macOS/Linux:** `ip addr` or `ifconfig`

2. Edit `backend/.env`:
   ```
   FRONTEND_ORIGINS=http://localhost:3000,http://192.168.1.10:3000
   ```

3. Restart the backend.

4. Open `http://192.168.1.10:3000` on your phone (replace with your IP).

> Vite already binds to `0.0.0.0` (host: true) so the frontend is accessible on LAN without any changes.

---

## 🤖 AI Setup

The AI chat works in **demo mode** out of the box (no key needed — returns placeholder responses).

To enable real GPT responses:

1. Get a key at https://platform.openai.com/api-keys
2. Edit `backend/.env`:
   ```
   OPENAI_API_KEY=sk-...your-key...
   AI_MODEL=gpt-4o-mini   # or gpt-3.5-turbo (cheaper), gpt-4o (best)
   ```
3. Restart the backend.

Check the AI status at http://localhost:8000/docs → `GET /api/ai/status`

---

## 🗂 Project Structure

```
nexus/
├── start-backend.sh / .bat     ← one-click startup
├── start-frontend.sh / .bat
├── backend/
│   ├── main.py                 ← FastAPI app, middleware, routes
│   ├── requirements.txt
│   ├── .env  (.env.example)
│   ├── uploads/                ← stored images (git-ignored)
│   ├── scripts/seed.py         ← community seeder
│   └── app/
│       ├── core/               config · security · dependencies
│       ├── models/             user · post · message · notification
│       ├── schemas/            auth · user · post · chat
│       ├── controllers/        auth · user · post · chat
│       ├── routers/            auth · users · posts · chat
│       │                       notifications · communities
│       │                       ai ← NEW  · uploads ← NEW
│       ├── ws_managers.py      ChatManager + NotificationManager
│       └── database.py         Motor MongoDB singleton
└── frontend/
    ├── index.html
    ├── vite.config.js          ← host:true, all proxies
    ├── .env  (.env.example)
    └── src/
        ├── App.jsx             ← Shell, CreateModal, routing
        ├── api/index.js        ← All HTTP + WS + upload + AI calls
        ├── context/            AuthContext · ThemeContext · LangContext
        ├── hooks/              useAuth · usePosts · useChat
        │                       useNotifications · useUpload ← NEW
        │                       useAI ← NEW
        ├── components/
        │   ├── auth/AuthScreen.jsx
        │   ├── layout/Sidebar · BottomNav · LangSelector
        │   ├── feed/PostCard.jsx
        │   └── ui/index.jsx    (all shared atoms + NotifBadge)
        ├── pages/              Feed · Discover · Messages · Notifications
        │                       Profile · AIPage ← NEW
        └── utils/helpers.js
```

---

## 🔑 Environment Variables

### `backend/.env`
| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB_NAME` | `nexus` | Database name |
| `JWT_SECRET` | _(change me!)_ | Secret for signing JWTs |
| `JWT_EXPIRE_MINUTES` | `10080` | 7 days |
| `FRONTEND_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `OPENAI_API_KEY` | _(blank = demo)_ | OpenAI key for AI chat |
| `AI_MODEL` | `gpt-4o-mini` | OpenAI model name |
| `UPLOAD_DIR` | `uploads` | Path for uploaded files |
| `MAX_UPLOAD_MB` | `10` | Max upload size |

### `frontend/.env`
No frontend AI key is required. The UI talks to the backend `/api/ai/*` routes, and Vite proxies those to `http://localhost:8000` during development.

---

## 📡 API Endpoints

```
Auth
  POST /api/auth/signup
  POST /api/auth/login
  POST /api/auth/logout
  GET  /api/auth/me

Posts
  GET  /api/posts/feed
  POST /api/posts/
  POST /api/posts/{id}/like
  POST /api/posts/{id}/comments

Chat
  WS   /api/chat/ws/{conversation_id}?token=…
  GET  /api/chat/conversations
  POST /api/chat/conversations
  GET  /api/chat/conversations/{id}/messages

Notifications
  WS   /api/notifications/ws?token=…
  GET  /api/notifications/
  POST /api/notifications/read-all

AI  ← NEW
  GET  /api/ai/status
  POST /api/ai/chat          body: { messages: [{role, content}] }

Uploads  ← NEW
  POST /api/uploads/image    multipart/form-data
  GET  /uploads/{filename}   static file serving
```

---

## 🔧 Changes Made in This Upgrade

### Bugs Fixed
- ✅ Deleted broken brace-expansion directories (`{core,models…}`, `{api,context…}`)
- ✅ CORS now supports multiple origins for LAN/mobile access
- ✅ WebSocket proxy entries fixed in `vite.config.js`
- ✅ Vite `host: true` added so mobile can reach the dev server

### New Features
- ✅ **AI Chat page** (`/ai`) — multi-turn history, markdown rendering, quick prompts, copy button
- ✅ **`/api/ai/chat`** endpoint — OpenAI integration with demo fallback
- ✅ **Image upload** (`/api/uploads/image`) — real file upload replacing base64
- ✅ **`useUpload` hook** — upload with progress/error state
- ✅ **`useAI` hook** — manages AI conversation history client-side
- ✅ **Startup scripts** — `start-backend.sh/bat` + `start-frontend.sh/bat`
- ✅ **AI nav item** in Sidebar + BottomNav
- ✅ **Online presence dot** on avatars
- ✅ Typing indicator wired to real WebSocket events
- ✅ Optimistic message echo for instant send feedback

---

## 💬 Support

Open an issue or reach out on the community Discord.
