import mongoose from "mongoose"

// A pending "add me as a contact" request. Accepting it makes both people
// contacts and deletes the request; declining or cancelling just deletes it.
const contactRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true })

contactRequestSchema.index({ from: 1, to: 1 }, { unique: true })
contactRequestSchema.index({ to: 1 })

export const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema)
