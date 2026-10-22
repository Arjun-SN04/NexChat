import { ScheduledMessage } from "../models/scheduledMessage.model.js"
import { deliverText } from "./deliver.js"
import { emitToUsers } from "./notify.js"

const EVERY_MS = 10_000

// Send scheduled messages that are due. Each one is claimed first ("sending")
// so it can never go out twice, even if a check overlaps.
const sendDue = async () => {
  for (;;) {
    const job = await ScheduledMessage.findOneAndUpdate(
      { status: "pending", sendAt: { $lte: new Date() } },
      { $set: { status: "sending" } },
      { sort: { sendAt: 1 }, new: true },
    )
    if (!job) return
    try {
      const msg = await deliverText({ senderId: job.sender, receiverId: job.receiver, groupId: job.group, text: job.text, ref: job.ref })
      job.status = "sent"
      job.sentMessage = msg._id
    } catch (err) {
      job.status = "failed"
      job.error = err.message
    }
    await job.save()
    emitToUsers([job.sender], "scheduledUpdated", { id: String(job._id), status: job.status })
  }
}

export const startScheduler = () => {
  // Anything left "sending" by a crash goes back in the queue
  ScheduledMessage.updateMany({ status: "sending" }, { $set: { status: "pending" } }).catch(() => {})
  setInterval(() => sendDue().catch((err) => console.log("scheduler error:", err.message)), EVERY_MS)
  console.log("⏰ Scheduled messages: checking every", EVERY_MS / 1000, "s")
}
