import { Call } from "../models/call.model.js"

// My recent calls, newest first
export const listCalls = async (req, res) => {
  try {
    const me = req.user._id
    const calls = await Call.find({ $or: [{ caller: me }, { callee: me }], hiddenFor: { $ne: me } })
      .sort({ startedAt: -1 })
      .limit(200)
      .select("-hiddenFor")
      .populate("caller callee", "fullName username avatar")
    res.status(200).json({ calls })
  } catch (error) {
    console.log("listCalls error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// Clear my Calls list. Calls are shared, so they're only hidden for me.
export const clearCalls = async (req, res) => {
  try {
    const me = req.user._id
    await Call.updateMany({ $or: [{ caller: me }, { callee: me }] }, { $addToSet: { hiddenFor: me } })
    res.status(200).json({ cleared: true })
  } catch (error) {
    console.log("clearCalls error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
