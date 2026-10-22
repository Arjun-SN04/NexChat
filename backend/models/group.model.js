import mongoose from "mongoose"

const { ObjectId } = mongoose.Schema.Types

// A group chat. Messages point at it with Message.groupId.
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, default: "", trim: true, maxlength: 300 },
  members: [{ type: ObjectId, ref: "User" }],
  admins: [{ type: ObjectId, ref: "User" }],
  createdBy: { type: ObjectId, ref: "User" },
  // Set when the group belongs to a community
  community: { type: ObjectId, ref: "Community", default: null },
  // A community's Announcements group: everyone in it, only admins can post
  announcement: { type: Boolean, default: false },
  // When each member last read the group, for unread counts: { userId: Date }
  reads: { type: Map, of: Date, default: {} },
}, { timestamps: true })

groupSchema.index({ members: 1 })
groupSchema.index({ community: 1 })

export const Group = mongoose.model("Group", groupSchema)
