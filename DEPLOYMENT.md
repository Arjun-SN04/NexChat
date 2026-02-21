# ChatApp — Deployment Guide

## Overview
- **Frontend**: React + Vite + Tailwind → Deploy on **Vercel**
- **Backend**: Node.js + Express + Socket.io → Deploy on **Render** (free tier, supports WebSockets)

---

## Step 1 — Push to GitHub

```bash
# From the C:\chat folder
git init
git add .
git commit -m "initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/chat-app.git
git push -u origin main
```

---

## Step 2 — Deploy Backend on Render

Render supports WebSockets (required for Socket.io). Vercel does NOT support WebSockets, so use Render for the backend.

1. Go to **https://render.com** → Sign up/login
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment**: `Node`
5. Add **Environment Variables**:
   ```
   MONGODB_URI=mongodb+srv://bindhusatheesh3838_db_user:RhzsqJb7efzT0rdX@cluster0.rarveqi.mongodb.net/?appName=Cluster0
   token=secretkey@123
   PORT=3000
   FRONTEND_URL=https://your-frontend.vercel.app   ← fill this after step 3
   ```
6. Click **Create Web Service**
7. Wait for deployment. Note your backend URL, e.g.:
   `https://chat-app-backend-xxxx.onrender.com`

---

## Step 3 — Deploy Frontend on Vercel

1. Go to **https://vercel.com** → Sign up/login
2. Click **New Project** → Import your GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   ```
   VITE_SOCKET_URL=https://chat-app-backend-xxxx.onrender.com
   ```
5. **IMPORTANT**: Open `frontend/vercel.json` and replace the placeholder with your real Render backend URL:
   ```json
   "destination": "https://chat-app-backend-xxxx.onrender.com/:path*"
   ```
   Commit and push this change before deploying.
6. Click **Deploy**
7. Note your frontend URL, e.g.: `https://chat-app.vercel.app`

---

## Step 4 — Update Backend CORS

Once you have your Vercel frontend URL:
1. Go to Render dashboard → your backend service → **Environment**
2. Update `FRONTEND_URL` to your actual Vercel URL:
   ```
   FRONTEND_URL=https://chat-app.vercel.app
   ```
3. Render will auto-redeploy.

---

## Step 5 — Test

1. Visit your Vercel URL: `https://chat-app.vercel.app`
2. Sign up two accounts in different browsers
3. Chat in real-time ✅

---

## Local Development (unchanged)

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev    # runs on http://localhost:3000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev    # runs on http://localhost:5173
```

The Vite proxy in `vite.config.js` handles `/api/*` → `localhost:3000` automatically in dev.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| API calls fail on Vercel | Check `vercel.json` has the correct Render backend URL |
| Socket not connecting | Check `VITE_SOCKET_URL` env var is set in Vercel |
| CORS errors | Make sure `FRONTEND_URL` on Render matches your Vercel URL exactly (no trailing slash) |
| Render sleeps after 15 min (free tier) | First request will be slow; upgrade to paid or use UptimeRobot to ping it |
