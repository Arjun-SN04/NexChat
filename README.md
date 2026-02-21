# 💬 NexChat

> **A modern, real-time chat application built with React, Node.js, Socket.io, and MongoDB.**

NexChat delivers instant messaging with a clean, responsive UI — complete with live online presence, unread notification badges, message editing and deletion, resizable panels, dark/light mode, and full conversation control. Designed to feel like a native desktop chat app in the browser.

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| **Frontend** | https://nex-chat-six.vercel.app |
| **Backend API** | https://nexchat-4zi1.onrender.com |

---

## ✨ Features

- ⚡ **Real-time messaging** — Powered by Socket.io WebSockets with sub-50ms delivery
- 🟢 **Live online presence** — See who's online right now, updated instantly
- 🔔 **Unread notifications** — Badge counter on contact avatars for unread messages, clears on open
- 👤 **New user detection** — Newly signed-up users appear in everyone's contact list instantly without refresh
- ✏️ **Edit messages** — Fix typos in any message you've sent
- 🗑️ **Delete messages** — Remove individual messages from a conversation
- 🧹 **Clear conversations** — Delete an entire conversation with one click
- 🌙 **Dark / Light mode** — Full theme toggle, persisted across sessions
- ↔️ **Resizable sidebar** — Drag the divider to resize panels (like WhatsApp on Windows), double-click to reset
- 📱 **Fully responsive** — Mobile-first layout, one panel at a time on small screens with back navigation
- 🔒 **Secure authentication** — JWT tokens stored in HTTP-only cookies, protected against XSS
- 👤 **Profile settings** — Update display name and change password

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Utility-first styling |
| React Router v7 | Client-side routing |
| Zustand | Lightweight global state management |
| Socket.io Client | Real-time WebSocket communication |
| Axios | HTTP requests |
| React Hook Form | Form validation |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Socket.io | WebSocket server for real-time events |
| MongoDB + Mongoose | Database and ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT auth tokens |
| cookie-parser | HTTP-only cookie handling |

### Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting (CDN + edge) |
| Render | Backend hosting (supports WebSockets) |
| MongoDB Atlas | Cloud database |

---

## 📁 Project Structure

```
chat/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── components/        # Page-level components
│   │   │   ├── HomePage.jsx   # Landing page
│   │   │   ├── Login.jsx      # Login page
│   │   │   ├── Signup.jsx     # Signup page
│   │   │   └── Profile.jsx    # Profile settings
│   │   ├── home/
│   │   │   ├── leftpart/      # Sidebar (contacts, search, user list)
│   │   │   │   ├── Left.jsx
│   │   │   │   ├── Users.jsx
│   │   │   │   ├── User.jsx   # Individual contact with notification badge
│   │   │   │   └── Logout.jsx
│   │   │   └── rightPart/     # Chat area
│   │   │       ├── Right.jsx
│   │   │       ├── ChatUser.jsx
│   │   │       ├── Messages.jsx
│   │   │       ├── Message.jsx
│   │   │       └── TypeSent.jsx
│   │   ├── context/           # React context + custom hooks
│   │   │   ├── AuthProvider.jsx
│   │   │   ├── SocketProvider.jsx
│   │   │   ├── ThemeProvider.jsx
│   │   │   ├── useGetAllUsers.jsx
│   │   │   ├── useGetMessages.js
│   │   │   ├── useListenMessages.js
│   │   │   └── useSendMessage.js
│   │   ├── Zustand/
│   │   │   └── UserConversation.js  # Global state (messages, unread counts)
│   │   └── App.jsx            # Routes + resizable chat layout
│   ├── vercel.json            # Vercel SPA routing + API proxy config
│   └── vite.config.js
│
└── backend/                   # Node.js + Express API
    ├── controller/
    │   ├── user.controller.js
    │   └── message.controller.js
    ├── models/
    │   ├── user.model.js
    │   ├── message.model.js
    │   └── conversation.model.js
    ├── routes/
    ├── socket/
    │   └── socket.js          # Socket.io server + online user tracking
    ├── middleware/
    ├── jwt/
    ├── seed.js                # Database seeder with sample data
    └── index.js               # Entry point
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/Arjun-SN04/NexChat.git
cd NexChat
```

### 2. Set up the Backend
```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:
```env
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string
token=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 3. Set up the Frontend
```bash
cd ../frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

### 4. (Optional) Seed the Database
```bash
cd backend
node seed.js
```

This creates **8 sample users** with realistic conversations:

| Email | Password |
|---|---|
| arjun@nexchat.com | arjun123 |
| priya@nexchat.com | priya123 |
| rahul@nexchat.com | rahul123 |
| sneha@nexchat.com | sneha123 |
| dev@nexchat.com | dev12345 |
| anjali@nexchat.com | anjali123 |
| karan@nexchat.com | karan123 |
| meera@nexchat.com | meera123 |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/user/signup` | Register a new user |
| POST | `/user/login` | Login and receive JWT cookie |
| POST | `/user/logout` | Logout and clear cookie |
| GET | `/user/allusers` | Get all users except self |
| PUT | `/user/update` | Update name or password |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| GET | `/message/get/:id` | Get all messages with a user |
| POST | `/message/send/:id` | Send a message |
| PUT | `/message/edit/:messageId` | Edit a sent message |
| DELETE | `/message/delete/:messageId` | Delete a message |
| DELETE | `/message/conversation/:id` | Clear entire conversation |

---

## 🔄 Real-time Socket Events

| Event | Direction | Description |
|---|---|---|
| `newMessage` | Server → Client | New message received |
| `messageEdited` | Server → Client | A message was edited |
| `messageDeleted` | Server → Client | A message was deleted |
| `conversationDeleted` | Server → Client | Conversation was cleared |
| `newUserJoined` | Server → All clients | New user signed up |
| `getOnlineUsers` | Server → All clients | Updated list of online user IDs |

---

## ☁️ Deployment

### Frontend → Vercel
1. Import GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_SOCKET_URL=https://your-backend.onrender.com`
4. Update `vercel.json` with your Render backend URL

### Backend → Render
1. Create a **Web Service** on [render.com](https://render.com)
2. Set **Root Directory** to `backend`
3. **Build**: `npm install` | **Start**: `node index.js`
4. Add environment variables: `MONGODB_URI`, `token`, `PORT=3000`, `FRONTEND_URL=https://your-app.vercel.app`

---

## 🗺️ Roadmap

- [ ] Typing indicator (showing "..." when someone is typing)
- [ ] Read receipts (double tick marks)
- [ ] Image and file sharing
- [ ] Group chats
- [ ] Push notifications
- [ ] Message search
- [ ] Emoji reactions

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Arjun** — [GitHub](https://github.com/Arjun-SN04)

---

<div align="center">
  <p>Built with ❤️ using React, Node.js, Socket.io & MongoDB</p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
