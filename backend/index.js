import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import userRoutes from "./routes/user.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import messageRoutes from "./routes/message.route.js"
import { app, server } from "./socket/socket.js"

dotenv.config()
const port = process.env.PORT || 3000
const mongo_uri = process.env.MONGODB_URI

mongoose.connect(mongo_uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err))

app.use(express.json())
app.use(cookieParser())

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL, // set this in Render/Railway/etc env vars
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
  })
);

app.use("/user", userRoutes)
app.use("/message", messageRoutes)

app.get("/", (req, res) => {
  res.send("ChatApp API is running")
})

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
