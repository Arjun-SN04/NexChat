import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthProvider";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// In production (Vercel), the socket server URL is same as backend deployed URL.
// Set VITE_SOCKET_URL in your Vercel environment variables to your backend URL.
// In development, it will fall back to localhost:3000.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [AuthUser] = useAuth();

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    const userId = AuthUser?._id;
    if (!userId) return;

    console.log("🔌 Connecting socket for user:", userId);

    const newSocket = io(SOCKET_URL, {
      query: { userId },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    newSocket.on("getOnlineUsers", (users) => {
      console.log("👥 Online users:", users);
      setOnlineUsers(users);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [AuthUser?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
