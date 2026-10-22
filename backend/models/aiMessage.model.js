import mongoose from "mongoose"

// One message in a user's private chat with NexChat AI
const aiMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, default: "" },
  // Things Nexa did for this answer, shown as cards: [{ type: "sent" | "scheduled" | "cancelled" | "failed", ... }]
  actions: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true })

export const AiMessage = mongoose.model("AiMessage", aiMessageSchema)
