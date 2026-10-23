import { randomUUID } from "crypto"
import User from "../models/user.model.js"
import { Group } from "../models/group.model.js"
import { ScheduledMessage } from "../models/scheduledMessage.model.js"
import { deliverText } from "./deliver.js"
import { emitToUsers } from "./notify.js"
import { readChat } from "./chatAccess.js"

// What Nexa can do. The server checks every action against the user's own permissions.
export const NEXA_TOOLS = [
  {
    type: "function",
    function: {
      name: "send_message",
      description: "Send a text message right now from the user to one of their contacts, groups, or themself ('me'). Only when the user clearly asks to send something.",
      parameters: {
        type: "object",
        properties: {
          recipient_id: { type: "string", description: "id from the contacts/groups list, or 'me'" },
          text: { type: "string", description: "The exact message to send" },
        },
        required: ["recipient_id", "text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_message",
      description: "Schedule a message to be sent later to a contact, a group, or the user themself ('me' = a reminder in their Message yourself chat).",
      parameters: {
        type: "object",
        properties: {
          recipient_id: { type: "string", description: "id from the contacts/groups list, or 'me'" },
          text: { type: "string", description: "The message to send" },
          send_at: { type: "string", description: "When to send, ISO 8601 with the user's UTC offset, e.g. 2026-10-23T09:00:00+05:30" },
        },
        required: ["recipient_id", "text", "send_at"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_scheduled_messages",
      description: "List the user's scheduled messages that haven't been sent yet.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_scheduled_message",
      description: "Cancel one of the user's scheduled messages (get ids from list_scheduled_messages).",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_messages",
      description: "Read the latest messages in one of the user's chats or groups, e.g. to summarize it or catch them up.",
      parameters: {
        type: "object",
        properties: {
          recipient_id: { type: "string", description: "id from the contacts/groups list, or 'me'" },
          count: { type: "integer", description: "How many recent messages (max 60)" },
        },
        required: ["recipient_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Create a picture from a text description (drawings, photos, art, logos, wallpapers). The image appears in this chat.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "A detailed English description of the image: subject, setting, style, lighting, colors. Expand short requests into a vivid prompt." },
          shape: { type: "string", enum: ["square", "portrait", "landscape"], description: "Image shape. Default square." },
        },
        required: ["prompt"],
      },
    },
  },
]

export const formatWhen = (date, timeZone) =>
  new Date(date).toLocaleString("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })

// Everyone and every group the user can message, for the prompt and for checking tool calls
export const loadNexaContext = async (user, timeZone) => {
  const me = await User.findById(user._id).populate("contacts", "fullName username")
  const groups = await Group.find({ members: user._id }).select("name announcement admins community").populate("community", "name")
  const people = new Map(me.contacts.map((c) => [String(c._id), c]))
  const groupMap = new Map(groups.map((g) => [String(g._id), g]))
  return { user, timeZone, people, groups: groupMap }
}

export const describeContext = (ctx) => {
  const people = [...ctx.people.values()].slice(0, 150).map((c) => `- ${c.fullName} (@${c.username}) id=${c._id}`)
  const groups = [...ctx.groups.values()].slice(0, 100).map((g) =>
    `- ${g.name}${g.community ? ` (in community ${g.community.name})` : ""}${g.announcement ? " [announcements]" : ""} id=${g._id}`)
  return `Contacts:\n${people.join("\n") || "(none)"}\nGroups:\n${groups.join("\n") || "(none)"}\nThe user themself: id=me`
}

// recipient_id -> { receiverId } | { groupId } plus a display name
const resolve = (ctx, id) => {
  const key = String(id || "").trim()
  if (["me", "self", String(ctx.user._id)].includes(key)) return { receiverId: ctx.user._id, name: "you (Message yourself)", chatId: String(ctx.user._id) }
  if (ctx.people.has(key)) return { receiverId: key, name: ctx.people.get(key).fullName, chatId: key }
  if (ctx.groups.has(key)) return { groupId: key, name: ctx.groups.get(key).name, chatId: key, isGroup: true }
  return null
}


// Run one tool call. Returns { result } for the model, and an optional `action` card for the chat.
export const runNexaTool = async (name, args, ctx) => {
  const me = ctx.user._id
  switch (name) {
    case "send_message": {
      const to = resolve(ctx, args.recipient_id)
      if (!to) return { result: { error: "Unknown recipient. Use an id from the list." } }
      try {
        const msg = await deliverText({ senderId: me, receiverId: to.receiverId, groupId: to.groupId, text: args.text })
        return {
          result: { ok: true, sent_to: to.name },
          action: { type: "sent", to: to.name, chatId: to.chatId, isGroup: !!to.isGroup, text: msg.message, messageId: String(msg._id) },
        }
      } catch (err) {
        return { result: { error: err.message }, action: { type: "failed", to: to.name, text: args.text, error: err.message } }
      }
    }

    case "schedule_message": {
      const to = resolve(ctx, args.recipient_id)
      if (!to) return { result: { error: "Unknown recipient. Use an id from the list." } }
      const text = String(args.text || "").trim()
      const sendAt = new Date(args.send_at)
      if (!text) return { result: { error: "The message is empty" } }
      if (Number.isNaN(sendAt.getTime())) return { result: { error: "Invalid time. Use ISO 8601 with the UTC offset." } }
      if (sendAt.getTime() < Date.now() + 15_000) return { result: { error: "That time has already passed. Ask the user for a future time." } }
      if (sendAt.getTime() > Date.now() + 366 * 24 * 3600_000) return { result: { error: "Messages can be scheduled up to a year ahead." } }
      if (to.groupId) {
        const g = ctx.groups.get(String(to.groupId))
        if (g.announcement && !g.admins.some((a) => String(a) === String(me))) return { result: { error: "Only admins can post in that announcements group" } }
      }
      const job = await ScheduledMessage.create({ sender: me, receiver: to.receiverId || null, group: to.groupId || null, text: text.slice(0, 4000), sendAt })
      emitToUsers([me], "scheduledUpdated", { id: String(job._id), status: "pending" })
      return {
        result: { ok: true, id: String(job._id), to: to.name, when: formatWhen(sendAt, ctx.timeZone) },
        action: { type: "scheduled", id: String(job._id), to: to.name, chatId: to.chatId, isGroup: !!to.isGroup, text, sendAt: sendAt.toISOString() },
      }
    }

    case "list_scheduled_messages": {
      const jobs = await ScheduledMessage.find({ sender: me, status: "pending" }).sort({ sendAt: 1 }).limit(30)
      return {
        result: {
          scheduled: jobs.map((j) => ({
            id: String(j._id),
            to: j.group ? ctx.groups.get(String(j.group))?.name || "a group" : String(j.receiver) === String(me) ? "you" : ctx.people.get(String(j.receiver))?.fullName || "a contact",
            text: j.text,
            when: formatWhen(j.sendAt, ctx.timeZone),
          })),
        },
      }
    }

    case "cancel_scheduled_message": {
      const job = await ScheduledMessage.findOneAndUpdate(
        { _id: String(args.id || ""), sender: me, status: "pending" },
        { $set: { status: "cancelled" } },
        { new: true },
      ).catch(() => null)
      if (!job) return { result: { error: "No pending scheduled message with that id" } }
      emitToUsers([me], "scheduledUpdated", { id: String(job._id), status: "cancelled" })
      const to = job.group ? ctx.groups.get(String(job.group))?.name : String(job.receiver) === String(me) ? "you" : ctx.people.get(String(job.receiver))?.fullName
      return { result: { ok: true }, action: { type: "cancelled", id: String(job._id), to, text: job.text } }
    }

    case "get_recent_messages": {
      const to = resolve(ctx, args.recipient_id)
      if (!to) return { result: { error: "Unknown chat. Use an id from the list." } }
      const chat = await readChat(me, to.chatId, { count: Number(args.count) || 30, timeZone: ctx.timeZone })
      if (!chat) return { result: { error: "You can't read that chat" } }
      return { result: { chat: to.name, messages: chat.lines } }
    }

    // The chat card then asks POST /api/ai/messages/:id/image to draw it (utils/imageGen.js)
    case "generate_image": {
      const prompt = String(args.prompt || "").trim().slice(0, 1000)
      if (!prompt) return { result: { error: "Describe the image" } }
      const shape = ["square", "portrait", "landscape"].includes(args.shape) ? args.shape : "square"
      return {
        result: { ok: true, note: "The image is being drawn in the chat now. Reply with one short line, don't describe the prompt." },
        action: { type: "image", id: randomUUID(), prompt, shape },
      }
    }

    default:
      return { result: { error: `Unknown tool ${name}` } }
  }
}
