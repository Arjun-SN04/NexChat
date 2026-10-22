import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import User from "../models/user.model.js"

// The account Nexa posts from in groups. Created once; it can't log in
// (random password nobody knows) and can't be found by username.
let cached = null

export const getNexaBot = async () => {
  if (cached) return cached
  let bot = await User.findOne({ isBot: true })
  if (!bot) {
    const taken = await User.exists({ username: "nexa" })
    bot = await User.create({
      fullName: "Nexa",
      email: "nexa@bot.nexchat.local",
      username: taken ? "nexa.ai" : "nexa",
      password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
      isBot: true,
    })
  }
  cached = bot
  return bot
}
