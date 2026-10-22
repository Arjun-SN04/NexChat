import { getReceiverSocketId, io } from "../socket/socket.js"

// Send a socket event to several users (skipping `except`, usually the sender)
export const emitToUsers = (userIds, event, data, except = null) => {
  const seen = new Set()
  for (const id of userIds) {
    const key = String(id?._id ?? id)
    if (!key || key === String(except) || seen.has(key)) continue
    seen.add(key)
    const socketId = getReceiverSocketId(key)
    if (socketId) io.to(socketId).emit(event, data)
  }
}
