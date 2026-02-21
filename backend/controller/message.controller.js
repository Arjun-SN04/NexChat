import { Conversation } from "../models/conversation.model.js"
import { Message } from "../models/message.model.js"
import { getReceiverSocketId, io } from "../socket/socket.js"

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body
    const { id: receiverId } = req.params
    const senderId = req.user._id

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] }
    })
    if (!conversation) {
      conversation = await Conversation.create({ members: [senderId, receiverId] })
    }

    const newMessage = new Message({ senderId, receiverId, message })
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

    existing.message = message
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

    await Message.deleteMany({ _id: { $in: conversation.messages } })
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
