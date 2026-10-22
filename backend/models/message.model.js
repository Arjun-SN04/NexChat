import mongoose from "mongoose";

// A field called "type" needs a different type key so Mongoose doesn't misread it
const callInfoSchema = new mongoose.Schema(
  { type: String, status: String, duration: Number },
  { _id: false, typeKey: "$type" },
)

const refSchema = new mongoose.Schema(
  { messageId: String, chatId: String, isGroup: Boolean, chatName: String },
  { _id: false },
)

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Direct messages have a receiver; group messages have a groupId instead
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, required: function () { return !this.groupId } },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null, index: true },
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
  // Call history entry shown in the chat: { type: voice|video, status: answered|missed|declined, duration (s) }
  call: { type: callInfoSchema, default: null },
  // Nexa's answers inside a one-to-one chat: the two people that chat belongs to
  botChat: { type: [mongoose.Schema.Types.ObjectId], default: undefined },
  // Text of a voice note, filled in when someone taps Transcribe
  transcript: { type: String, default: null },
  // A reminder's link back to the message it's about
  ref: { type: refSchema, default: null },
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
