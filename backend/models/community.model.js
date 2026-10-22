import mongoose from "mongoose"

const { ObjectId } = mongoose.Schema.Types

// A community holds several groups. Every member is in its Announcements group
// and can join any of its other groups.
const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, default: "", trim: true, maxlength: 300 },
  members: [{ type: ObjectId, ref: "User" }],
  admins: [{ type: ObjectId, ref: "User" }],
  createdBy: { type: ObjectId, ref: "User" },
  announcements: { type: ObjectId, ref: "Group", default: null },
}, { timestamps: true })

communitySchema.index({ members: 1 })

export const Community = mongoose.model("Community", communitySchema)
