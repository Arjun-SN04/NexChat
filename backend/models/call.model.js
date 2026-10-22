import mongoose from "mongoose"

const { ObjectId } = mongoose.Schema.Types

// One finished (or missed) call, for the Calls list
const callSchema = new mongoose.Schema({
  caller: { type: ObjectId, ref: "User", required: true },
  callee: { type: ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["voice", "video"], required: true },
  // answered: they talked · missed: no answer / cancelled / offline / busy · declined: callee said no
  status: { type: String, enum: ["answered", "missed", "declined"], required: true },
  startedAt: { type: Date, required: true },
  answeredAt: { type: Date, default: null },
  endedAt: { type: Date, required: true },
  duration: { type: Number, default: 0 }, // seconds of talk time
  // People who cleared this call from their Calls list
  hiddenFor: [{ type: ObjectId, ref: "User" }],
}, { timestamps: true })

callSchema.index({ caller: 1, startedAt: -1 })
callSchema.index({ callee: 1, startedAt: -1 })

export const Call = mongoose.model("Call", callSchema)
