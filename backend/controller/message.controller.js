import { Conversation } from "../models/conversation.model.js"
import { Message } from "../models/message.model.js"
import { getReceiverSocketId, io } from "../socket/socket.js"
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js"
import User from "../models/user.model.js"

// Forwarded messages share the same Cloudinary file. Only delete a file once
// no remaining message uses it. Call this AFTER deleting the messages.
const releaseAttachments = async (attachments = []) => {
  const unused = []
  for (const a of attachments) {
    if (!a?.publicId) continue
    const stillUsed = await Message.exists({ "attachment.publicId": a.publicId })
    if (!stillUsed) unused.push(a)
  }
  await deleteFromCloudinary(unused)
}

const MAX_BULK = 50

// Messages can only be edited for this long after they are sent
export const EDIT_WINDOW_MS = 10 * 60 * 1000

export const sendMessage = async (req, res) => {
  try {
    const { message, replyTo } = req.body
    const { id: receiverId } = req.params
    const senderId = req.user._id

    const text = (message || "").trim()
    if (!text && !req.file) return res.status(400).json({ error: "Message cannot be empty" })

    // A reply must point at a message from this same conversation
    if (replyTo) {
      const original = await Message.findById(replyTo).select("senderId receiverId")
      const members = [senderId.toString(), receiverId.toString()]
      if (!original || !members.includes(original.senderId.toString()) || !members.includes(original.receiverId.toString())) {
        return res.status(400).json({ error: "Invalid reply target" })
      }
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] }
    })
    if (!conversation) {
      conversation = await Conversation.create({ members: [senderId, receiverId] })
    }

    // Upload the attachment (if any) only after the request is validated
    let attachment = null
    if (req.file) {
      try {
        attachment = await uploadToCloudinary(req.file)
      } catch (err) {
        console.log("Cloudinary upload error:", err?.message || err)
        return res.status(502).json({ error: "Upload failed. Please try again." })
      }
    }

    const newMessage = new Message({ senderId, receiverId, message: text, replyTo: replyTo || null, attachment })
    conversation.messages.push(newMessage._id)
    await Promise.all([conversation.save(), newMessage.save()])

    const receiverSocketId = getReceiverSocketId(receiverId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage)
    }

    res.status(201).json(newMessage)
  } catch (error) {
    console.log("sendMessage error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getMessage = async (req, res) => {
  try {
    const { id: chatUser } = req.params
    const senderId = req.user._id
    let conversation = await Conversation.findOne({
      members: { $all: [senderId, chatUser] }
    }).populate("messages")
    if (!conversation) return res.status(200).json([])
    res.status(200).json(conversation.messages)
  } catch (error) {
    console.log("getMessage error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params
    const userId = req.user._id
    const message = await Message.findById(messageId)
    if (!message) return res.status(404).json({ error: "Message not found" })
    if (message.senderId.toString() !== userId.toString())
      return res.status(403).json({ error: "Not authorized to delete this message" })

    // Remove from conversation
    await Conversation.updateMany(
      { messages: messageId },
      { $pull: { messages: messageId } }
    )
    await Message.findByIdAndDelete(messageId)
    await releaseAttachments([message.attachment])

    // Notify both parties via socket
    const receiverSocketId = getReceiverSocketId(message.receiverId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId)
    }

    res.status(200).json({ message: "Message deleted", messageId })
  } catch (error) {
    console.log("deleteMessage error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params
    const { message } = req.body
    const userId = req.user._id
    const existing = await Message.findById(messageId)
    if (!existing) return res.status(404).json({ error: "Message not found" })
    if (existing.senderId.toString() !== userId.toString())
      return res.status(403).json({ error: "Not authorized to edit this message" })
    if (Date.now() - existing.createdAt.getTime() > EDIT_WINDOW_MS)
      return res.status(403).json({ error: "Messages can only be edited within 10 minutes of sending" })
    if (!message?.trim() && !existing.attachment) return res.status(400).json({ error: "Message cannot be empty" })

    existing.message = (message || "").trim()
    existing.edited = true
    await existing.save()

    const receiverSocketId = getReceiverSocketId(existing.receiverId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", existing)
    }

    res.status(200).json(existing)
  } catch (error) {
    console.log("editMessage error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const deleteConversation = async (req, res) => {
  try {
    const { id: otherUserId } = req.params
    const userId = req.user._id

    const conversation = await Conversation.findOne({
      members: { $all: [userId, otherUserId] }
    })
    if (!conversation) return res.status(404).json({ error: "Conversation not found" })

    const withFiles = await Message.find({ _id: { $in: conversation.messages }, attachment: { $ne: null } }).select("attachment")
    await Message.deleteMany({ _id: { $in: conversation.messages } })
    await releaseAttachments(withFiles.map((m) => m.attachment))
    await Conversation.findByIdAndDelete(conversation._id)

    const receiverSocketId = getReceiverSocketId(otherUserId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("conversationDeleted", { otherUserId: userId })
    }

    res.status(200).json({ message: "Conversation deleted" })
  } catch (error) {
    console.log("deleteConversation error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Mark every message the other person sent me as seen, and tell them.
export const markSeen = async (req, res) => {
  try {
    const { id: otherUserId } = req.params
    const userId = req.user._id

    const result = await Message.updateMany(
      { senderId: otherUserId, receiverId: userId, seen: { $ne: true } },
      { $set: { seen: true } }
    )

    if (result.modifiedCount > 0) {
      const senderSocketId = getReceiverSocketId(otherUserId)
      if (senderSocketId) io.to(senderSocketId).emit("messagesSeen", { by: userId.toString() })
    }

    res.status(200).json({ updated: result.modifiedCount })
  } catch (error) {
    console.log("markSeen error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Sidebar summary: last message and unread count for each conversation.
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id

    const conversations = await Conversation.find({ members: userId }).select("members messages")
    const lastIds = conversations.map((c) => c.messages[c.messages.length - 1]).filter(Boolean)
    const lastMessages = await Message.find({ _id: { $in: lastIds } })
      .select("message senderId receiverId createdAt attachment.kind attachment.name")
    const lastById = new Map(lastMessages.map((m) => [m._id.toString(), m]))

    // Only messages explicitly marked unseen count (older messages have no flag)
    const unread = await Message.aggregate([
      { $match: { receiverId: userId, seen: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
    ])
    const unreadBySender = new Map(unread.map((u) => [u._id.toString(), u.count]))

    const summary = conversations.map((c) => {
      const otherId = c.members.find((m) => m.toString() !== userId.toString())?.toString()
      const lastId = c.messages[c.messages.length - 1]?.toString()
      return {
        userId: otherId,
        lastMessage: lastId ? lastById.get(lastId) || null : null,
        unread: unreadBySender.get(otherId) || 0,
      }
    }).filter((c) => c.userId)

    res.status(200).json(summary)
  } catch (error) {
    console.log("getConversations error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Delete several of my own messages at once.
export const deleteMessages = async (req, res) => {
  try {
    const userId = req.user._id
    const ids = Array.isArray(req.body.ids) ? req.body.ids.slice(0, MAX_BULK) : []
    if (!ids.length) return res.status(400).json({ error: "No messages selected" })

    // Only messages I sent can be deleted
    const mine = await Message.find({ _id: { $in: ids }, senderId: userId })
    if (!mine.length) return res.status(403).json({ error: "You can only delete your own messages" })
    const mineIds = mine.map((m) => m._id)

    await Conversation.updateMany({ messages: { $in: mineIds } }, { $pull: { messages: { $in: mineIds } } })
    await Message.deleteMany({ _id: { $in: mineIds } })
    await releaseAttachments(mine.map((m) => m.attachment))

    // Tell each receiver which of their messages disappeared
    const byReceiver = {}
    mine.forEach((m) => (byReceiver[m.receiverId.toString()] ||= []).push(m._id.toString()))
    Object.entries(byReceiver).forEach(([receiverId, deletedIds]) => {
      const socketId = getReceiverSocketId(receiverId)
      if (socketId) io.to(socketId).emit("messagesDeleted", deletedIds)
    })

    res.status(200).json({ deleted: mineIds.map(String) })
  } catch (error) {
    console.log("deleteMessages error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Forward messages (text and/or media) to one or more people.
// Media is not re-uploaded: the copies point at the same Cloudinary file.
export const forwardMessages = async (req, res) => {
  try {
    const userId = req.user._id
    const messageIds = Array.isArray(req.body.messageIds) ? req.body.messageIds.slice(0, MAX_BULK) : []
    const receiverIds = Array.isArray(req.body.receiverIds) ? req.body.receiverIds.slice(0, 20) : []
    if (!messageIds.length || !receiverIds.length)
      return res.status(400).json({ error: "Pick at least one message and one person" })

    // You can only forward messages from your own chats
    const originals = await Message.find({
      _id: { $in: messageIds },
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: 1 })
    if (!originals.length) return res.status(404).json({ error: "Messages not found" })

    const receivers = await User.find({ _id: { $in: receiverIds, $ne: userId } }).select("_id")
    const created = []

    for (const receiver of receivers) {
      let conversation = await Conversation.findOne({ members: { $all: [userId, receiver._id] } })
      if (!conversation) conversation = await Conversation.create({ members: [userId, receiver._id] })

      const copies = originals.map((o) => new Message({
        senderId: userId,
        receiverId: receiver._id,
        message: o.message,
        attachment: o.attachment,
        forwarded: true,
      }))
      await Message.insertMany(copies)
      conversation.messages.push(...copies.map((c) => c._id))
      await conversation.save()

      const socketId = getReceiverSocketId(receiver._id)
      if (socketId) copies.forEach((c) => io.to(socketId).emit("newMessage", c))
      created.push(...copies)
    }

    res.status(201).json(created)
  } catch (error) {
    console.log("forwardMessages error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// React to a message with an emoji. One reaction per person:
// the same emoji again removes it, a different emoji replaces it.
const EMOJI_RE = /^\p{Extended_Pictographic}/u

export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params
    const { emoji } = req.body
    const userId = req.user._id

    if (typeof emoji !== "string" || emoji.length > 16 || !EMOJI_RE.test(emoji))
      return res.status(400).json({ error: "Invalid reaction" })

    const message = await Message.findById(messageId)
    if (!message) return res.status(404).json({ error: "Message not found" })
    const isMember = message.senderId.equals(userId) || message.receiverId.equals(userId)
    if (!isMember) return res.status(403).json({ error: "Not allowed" })

    const mine = message.reactions.find((r) => r.userId.equals(userId))
    if (mine && mine.emoji === emoji) message.reactions = message.reactions.filter((r) => !r.userId.equals(userId))
    else if (mine) mine.emoji = emoji
    else message.reactions.push({ userId, emoji })
    await message.save()

    const otherId = message.senderId.equals(userId) ? message.receiverId : message.senderId
    const socketId = getReceiverSocketId(otherId)
    if (socketId) io.to(socketId).emit("messageReacted", { messageId, reactions: message.reactions })

    res.status(200).json({ messageId, reactions: message.reactions })
  } catch (error) {
    console.log("reactToMessage error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
