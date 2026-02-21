# 💬 NexChat

> **A modern real-time chat application built with React, Node.js, Socket.io, and MongoDB.**

NexChat delivers instant messaging with a clean, responsive UI — featuring live online presence, unread badges, message editing/deletion, resizable panels, dark/light mode, and full conversation control.

---

## 🌐 Live Demo

| Service         | URL                                                                    |
| --------------- | ---------------------------------------------------------------------- |
| **Frontend**    | [https://nex-chat-six.vercel.app](https://nex-chat-six.vercel.app)     |
| **Backend API** | [https://nexchat-4zi1.onrender.com](https://nexchat-4zi1.onrender.com) |

---

## ✨ Features

* ⚡ Real-time messaging (Socket.io)
* 🟢 Live online user presence
* 🔔 Unread message badges
* ✏️ Edit & 🗑️ delete messages
* 🧹 Clear entire conversations
* 🌙 Dark / Light mode (persistent)
* ↔️ Resizable sidebar layout
* 📱 Fully responsive design
* 🔒 JWT authentication (HTTP-only cookies)
* 👤 Profile settings (update name/password)

---

## 🛠️ Tech Stack

### Frontend

* React 19 + Vite
* Tailwind CSS v4
* React Router v7
* Zustand (state management)
* Socket.io Client
* Axios
* React Hook Form

### Backend

* Node.js + Express
* Socket.io
* MongoDB + Mongoose
* bcryptjs
* jsonwebtoken
* cookie-parser

### Deployment

* Vercel (Frontend)
* Render (Backend)
* MongoDB Atlas (Database)

---

## 📁 Project Structure

```
chat/
├── frontend/        # React + Vite app
└── backend/         # Express + Socket.io API
```

Full structure includes:

* Auth & message controllers
* MongoDB models (User, Message, Conversation)
* Real-time socket server
* Zustand global state
* Custom React hooks

---

## 🚀 Getting Started

### 1️⃣ Clone Repo

```bash
git clone https://github.com/Arjun-SN04/NexChat.git
cd NexChat
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```env
PORT=3000
MONGODB_URI=your_mongodb_uri
token=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

Run:

```bash
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

---

### 4️⃣ (Optional) Seed Database

```bash
cd backend
node seed.js
```

Creates 8 demo users with sample conversations.

---

## 🔌 API Endpoints

### Auth

* `POST /user/signup`
* `POST /user/login`
* `POST /user/logout`
* `GET /user/allusers`
* `PUT /user/update`

### Messages

* `GET /message/get/:id`
* `POST /message/send/:id`
* `PUT /message/edit/:messageId`
* `DELETE /message/delete/:messageId`
* `DELETE /message/conversation/:id`

---

## 🔄 Real-Time Events

* `newMessage`
* `messageEdited`
* `messageDeleted`
* `conversationDeleted`
* `newUserJoined`
* `getOnlineUsers`

---

## ☁️ Deployment

**Frontend → Vercel**

* Root: `frontend`
* Add `VITE_SOCKET_URL`

**Backend → Render**

* Root: `backend`
* Build: `npm install`
* Start: `node index.js`
* Add environment variables

---

## 🗺️ Roadmap

* Typing indicators
* Read receipts
* File sharing
* Group chats
* Push notifications
* Message search
* Emoji reactions

---

## 🤝 Contributing

1. Fork
2. Create branch
3. Commit
4. Push
5. Open PR

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Arjun**
GitHub: [https://github.com/Arjun-SN04](https://github.com/Arjun-SN04)

---

<div align="center">
Built with ❤️ using React, Node.js, Socket.io & MongoDB  
⭐ Star the repo if you found it helpful!
</div>
