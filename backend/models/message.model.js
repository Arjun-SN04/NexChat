import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Text is optional when the message has an attachment
  message: { type: String, default: "" },
  edited: { type: Boolean, default: false },
  // The message this one is replying to (null for normal messages)
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  // Set when the receiver has opened the chat (read receipts / unread counts)
  seen: { type: Boolean, default: false },
  // Emoji reactions: one per person (reacting again with the same emoji removes it)
  reactions: {
    type: [{ _id: false, userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, emoji: String }],
    default: [],
  },
  // True when this message was forwarded from another chat
  forwarded: { type: Boolean, default: false },
  // Image / video / voice note / file stored on Cloudinary
  attachment: {
    type: {
      url: String,
      publicId: String,
      resourceType: String, // image | video | raw
      kind: String,         // image | video | file
      name: String,
      size: Number,
      mimeType: String,
      width: Number,
      height: Number,
      duration: Number,     // seconds, for voice notes / videos
    },
    default: null,
  },
}, { timestamps: true })

export const Message = mongoose.model("Message", messageSchema)
