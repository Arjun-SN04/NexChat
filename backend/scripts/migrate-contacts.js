// One-time upgrade for existing data. Safe to run again.
// - gives every user a username (from their email) and an invite link token
// - makes people who already have a chat together contacts, so nobody loses a chat
// Run: node scripts/migrate-contacts.js
import dns from "node:dns"
import dotenv from "dotenv"
import mongoose from "mongoose"
import User from "../models/user.model.js"
import { Conversation } from "../models/conversation.model.js"
import { generateUsername, newInviteToken } from "../utils/username.js"

dotenv.config()
dns.setServers(["8.8.8.8", "1.1.1.1"])

await mongoose.connect(process.env.MONGODB_URI)
await User.syncIndexes()

let named = 0
for (const user of await User.find({ $or: [{ username: { $in: [null, ""] } }, { inviteToken: { $in: [null, ""] } }] })) {
  if (!user.username) {
    user.username = await generateUsername(user.email.split("@")[0])
    named++
  }
  if (!user.inviteToken) user.inviteToken = newInviteToken()
  await user.save()
  console.log(`@${user.username}  ${user.email}`)
}

let linked = 0
for (const c of await Conversation.find().select("members")) {
  const [a, b] = c.members
  if (!a || !b || a.equals(b)) continue
  await User.updateOne({ _id: a }, { $addToSet: { contacts: b } })
  await User.updateOne({ _id: b }, { $addToSet: { contacts: a } })
  linked++
}

console.log(`Done: ${named} usernames added, ${linked} chats turned into contacts`)
await mongoose.disconnect()
