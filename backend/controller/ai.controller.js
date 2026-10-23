import { AiMessage } from "../models/aiMessage.model.js"
import { ScheduledMessage } from "../models/scheduledMessage.model.js"
import { askGroq, groqChat } from "../utils/groq.js"
import { NEXA_TOOLS, describeContext, formatWhen, loadNexaContext, runNexaTool } from "../utils/nexaTools.js"
import { emitToUsers } from "../utils/notify.js"
import { deleteFromCloudinary, uploadToCloudinary } from "../config/cloudinary.js"
import { generateImage } from "../utils/imageGen.js"
import { Message } from "../models/message.model.js"
import User from "../models/user.model.js"
import { Group } from "../models/group.model.js"
import { groqTranscribe } from "../utils/groq.js"
import { canSeeMessage, messageText, readChat } from "../utils/chatAccess.js"
import { getNexaBot } from "../utils/nexaBot.js"
import { notifyAudience } from "./message.controller.js"

const MAX_INPUT = 4000        // characters per question
const HISTORY = 6             // earlier messages sent as context (kept short: Groq free tier is ~8k tokens per request)
const LIMIT_PER_MINUTE = 12   // per user, to protect the free API quota

// What NexChat AI knows about the app, so it can help people use it
const MAX_TOOL_ROUNDS = 5

// The browser sends its time zone; fall back to UTC if it's missing or invalid
const safeTimeZone = (tz) => {
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return tz } catch { return "UTC" }
}
const offsetOf = (timeZone) =>
  new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value || "GMT"

const systemPrompt = (user, ctx) => `You are Nexa, the friendly AI assistant built into NexChat, a real-time messenger.
If asked who you are: you're Nexa, NexChat's assistant.
You are chatting with ${user.fullName} (@${user.username}).

Help with two things:
1. Using NexChat. Key facts:
- Contacts are private. Add people with the person-plus button in the Chats header: search an exact @username to send a request, or open "My QR" to share an invite link or QR code (opening it adds you instantly). Requests appear in the Requests tab.
- "Message yourself" is pinned at the top of the chat list for notes.
- Messages: replies, emoji reactions (hover a message), edit within 10 minutes, delete, forward, multi-select, photos/videos/files up to 10 MB, camera photos, voice notes up to 2 minutes, an emoji picker.
- Calls: phone and video buttons in a chat header (contacts only). Calls appear in the chat and in the Calls tab of the left rail.
- Groups: pen icon in the Chats header > New group. Admins can rename, add/remove people and make admins.
- Communities: pen icon > New community (or the + in the Communities tab). It creates an Announcements group where only community admins post; everyone in the community is in it. Community admins add people from their contacts (there is no search or "request to join" for communities). Members open the community page (Communities tab > View all) and press Join on any of its groups. Admins can create groups in it, add or remove members, and make admins.
- Profile (gear icon): name, @username, photo, password. Light/dark theme toggle in the left rail (applies to the whole app, not per chat or community).
- The left rail has three tabs: Chats, Calls, Communities.
- NexChat does NOT have: pinned chats or messages, starred messages, stories/status, group calls, group photos, community themes, scheduled messages, message search inside a chat, or end-to-end encryption of messages.
2. Anything else the user asks: writing messages, ideas, explanations, summaries, quick facts.

You can also DO things for the user with your tools:
- send_message: send a message now to a contact, group, or themself.
- schedule_message: send one later (also reminders: recipient "me" puts it in their Message yourself chat).
- list_scheduled_messages / cancel_scheduled_message.
- get_recent_messages: read a chat to summarize it or catch them up.
- browser_search: search the web. Use it for anything current or that may have changed: news, prices, weather, sports, releases, people in the news, or facts you're unsure of. Never invent news or numbers; search instead. Don't mention the search itself or paste links (sources are shown under your answer).
- generate_image: create a picture (art, photos, logos, wallpapers, illustrations). Use it whenever the user asks you to draw, create, generate or make an image or picture. Write a vivid, detailed English prompt. After calling it, reply in one short line (no bullets about the prompt).
  You CAN create images. Never say you can't make images; if earlier replies in this chat said so, they were wrong, so just call generate_image.
You can also rewrite text: shorten, make it more professional or friendlier, fix grammar, translate.

Right now for the user: ${formatWhen(new Date(), ctx.timeZone)} (${ctx.timeZone}, ${offsetOf(ctx.timeZone)}). Interpret times like "tomorrow 9am" in this time zone and give send_at with this UTC offset.
${describeContext(ctx)}

Acting rules:
- Only send or schedule when the user clearly asks. If the person, group or time is unclear (e.g. two people match), ask one short question instead.
- Send the user's words; only reword when they ask you to (e.g. "make it nicer").
- After acting, confirm in one short sentence (who, and when). Don't repeat ids.
- Never claim you did something unless the tool returned ok.

Rules: only describe NexChat features listed above. If someone asks about something not listed, say NexChat doesn't have it (yet) rather than inventing steps or buttons.
Style: write like a helpful friend in a chat app.
- By default, answer as short bullet points ("- " lines): usually 2 to 5 bullets, each one line (under about 15 words). A single fact can be one bullet.
- When the user asks you to write something to send (a wish, a reply), give the text itself as a quote ("> ..."), then at most one bullet.
- Visuals: when it genuinely helps the user understand, you may use one instead of (or before) the bullets:
  - A Markdown table for comparisons, pros and cons, schedules, or several items with the same attributes. Keep it to about 2 to 5 columns and short cells.
  - A Mermaid diagram for processes, steps, decisions, timelines or how things connect, in a fenced \`\`\`mermaid code block. Prefer "flowchart TD" (or "flowchart LR" for short chains). Use simple node ids (A, B, C) with labels in double quotes, e.g. A["Start"] --> B{"Paid?"} -->|"Yes"| C["Ship"]. Keep it under about 12 nodes. No styling, classDef or comments.
  - Use a visual when the user asks for a chart, flowchart, diagram, table or comparison, or when the answer is clearly a process or comparison. For simple questions, stick to bullets.
  - After a visual, add at most 2 short bullets.
- Code: when the user asks for code, give complete, working code. Put each file in its own fenced block with the language and the file name after it, e.g. \`\`\`csharp FactionManager.cs (one block per file; never merge files). Skip the bullet limit for code, but keep the explanation around it to a few short bullets.
- Never use em dashes or en dashes. Use commas, colons or full stops instead.
- No headings, no "Quick tips" sections, no intro line, no sign-off like "Let me know if...".
- Use **bold** only for button or tab names. At most one emoji, and only when it fits.`

const recent = {} // userId -> timestamps of recent questions

// Groq's free tier allows ~8,000 tokens per request (prompt + reply room), so earlier
// messages are sent within a budget: newest first, long ones (code) shortened.
const HISTORY_CHARS = 4000      // ~1,100 tokens of earlier chat
const HISTORY_MSG_CHARS = 800   // per earlier message
const shorten = (text) => (text.length > HISTORY_MSG_CHARS ? `${text.slice(0, HISTORY_MSG_CHARS)}\n…(shortened)` : text)
const historyFor = (messages, budget = HISTORY_CHARS) => {
  const out = []
  let used = 0
  for (const m of [...messages].reverse()) {
    const content = shorten(m.content || "(done)")
    if (used + content.length > budget) break
    used += content.length
    out.unshift({ role: m.role, content })
  }
  // Start on a user turn
  while (out[0]?.role === "assistant") out.shift()
  return out
}

// "draw a cat", "create an iamge of…", "make me a wallpaper": these must call generate_image
const IMAGE_NOUN = "(?:image|imag|iamge|imgae|imge|img|picture|pic|photo|drawing|painting|illustration|wallpaper|logo|artwork|poster|sketch|portrait|icon|avatar)s?"
const IMAGE_RE = new RegExp(`\\b(?:draw|paint|sketch|generate|create|make|design|render|produce|give me|show me)\\b.{0,40}\\b${IMAGE_NOUN}\\b|^\\s*(?:please\\s+|can you\\s+|could you\\s+)?(?:draw|paint|sketch)\\b|\\b${IMAGE_NOUN}\\s+of\\b`, "i")
const NOT_IMAGE_RE = /\b(how (do|can|to)|where|profile (pic|picture|photo)|send (a |the )?(photo|pic|picture|image)|attach)/i
const wantsImage = (text) => text.length < 600 && IMAGE_RE.test(text) && !NOT_IMAGE_RE.test(text)
const FORCE_IMAGE = { type: "function", function: { name: "generate_image" } }

// Nexa's tools plus Groq's built-in web search
const TOOLS = [...NEXA_TOOLS, { type: "browser_search" }]

// Links from Groq's web search, pages Nexa actually opened first
const sourcesOf = (executed = []) => {
  const searches = executed.filter((t) => t.type === "browser_search")
  const opened = new Set(searches.filter((t) => !/"query"/.test(t.arguments || "")).flatMap((t) => (t.search_results?.results || []).map((r) => r.url)))
  const found = searches.filter((t) => /"query"/.test(t.arguments || "")).flatMap((t) => t.search_results?.results || [])
  return found
    .filter((r) => /^https?:\/\//.test(r.url || "") && r.title)
    .sort((a, b) => opened.has(b.url) - opened.has(a.url))
    .map((r) => ({ title: String(r.title).slice(0, 120), url: r.url }))
}

const CAPABILITY_RE = /\b(what (can|could|do) you (do|help)|what are you (capable|able)|your (capabilities|features|skills)|how can you help|what do you offer|what can nexa)\b|^(help|capabilities|features)\??$/i
const CAPABILITIES_TEXT = `Here's what I can do:
- **Send messages** for you, now or later
- **Reminders**, like "remind me at 6pm to call mom"
- **Scheduled messages**: list or cancel them
- **Catch you up** on any chat or group
- **Write and rewrite**: drafts, polish, translate
- **Create images**, like "draw a cozy cabin in the snow"
- **Search the web** for news, prices, scores and anything current
- **NexChat help**: contacts, groups, calls, communities
- In any chat: ✨ rewrite, smart replies, Catch me up, Translate, Transcribe, Remind me, and **@Nexa** in groups`

export const getAiMessages = async (req, res) => {
  try {
    const messages = await AiMessage.find({ user: req.user._id }).sort({ createdAt: 1 }).limit(500)
    res.status(200).json({ messages })
  } catch (error) {
    console.log("getAiMessages error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const sendAiMessage = async (req, res) => {
  try {
    const me = req.user
    const text = String(req.body.message || "").trim()
    if (!text) return res.status(400).json({ error: "Ask something first" })
    if (text.length > MAX_INPUT) return res.status(400).json({ error: `Please keep it under ${MAX_INPUT} characters` })

    const id = String(me._id)
    const now = Date.now()
    recent[id] = (recent[id] || []).filter((t) => now - t < 60_000)
    if (recent[id].length >= LIMIT_PER_MINUTE) return res.status(429).json({ error: "You're asking quickly. Wait a moment and try again." })
    recent[id].push(now)

    // "What can you do?" -> instant, consistent answer with a capabilities card
    if (CAPABILITY_RE.test(text) && text.length < 80) {
      const question = await AiMessage.create({ user: me._id, role: "user", content: text })
      const answer = await AiMessage.create({ user: me._id, role: "assistant", content: CAPABILITIES_TEXT, actions: [{ type: "capabilities" }] })
      return res.status(201).json({ question, answer })
    }

    const ctx = await loadNexaContext(me, safeTimeZone(req.body.timeZone))
    const history = (await AiMessage.find({ user: me._id }).sort({ createdAt: -1 }).limit(HISTORY)).reverse()
    const question = await AiMessage.create({ user: me._id, role: "user", content: text })

    // Let the model call tools until it gives a final answer
    const earlier = historyFor(history)
    let trimmed = false
    const convo = [
      { role: "system", content: systemPrompt(me, ctx) },
      ...earlier,
      { role: "user", content: text },
    ]
    const actions = []
    const sources = []
    let reply = ""
    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        // An image request: the first turn must call generate_image (the model sometimes refuses otherwise)
        const forceImage = round === 0 && wantsImage(text)
        const options = { tools: TOOLS, maxTokens: 1500, ...(forceImage ? { toolChoice: FORCE_IMAGE } : {}) }
        let msg
        try {
          msg = await groqChat(convo, options)
        } catch (err) {
          if (err.code !== "too_large") throw err
          // Still too big: drop the earlier chat and leave less room for the reply
          if (!trimmed) { convo.splice(1, earlier.length); trimmed = true }
          msg = await groqChat(convo, { ...options, maxTokens: 1000 })
        }
        sources.push(...sourcesOf(msg.executed_tools))
        if (!msg.tool_calls?.length) { reply = msg.content?.trim() || ""; break }
        convo.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls })
        for (const callItem of msg.tool_calls) {
          let args = {}
          try { args = JSON.parse(callItem.function.arguments || "{}") } catch { /* bad JSON: tool reports it */ }
          const { result, action } = await runNexaTool(callItem.function.name, args, ctx)
          if (action) actions.push(action)
          convo.push({ role: "tool", tool_call_id: callItem.id, content: JSON.stringify(result) })
        }
      }
    } catch (err) {
      // Nothing happened and no answer: keep the question out of the history
      if (!actions.length) {
        await AiMessage.deleteOne({ _id: question._id })
        return res.status(503).json({ error: err.message })
      }
    }
    if (!reply) reply = actions.length ? "Done." : "Sorry, I couldn't finish that. Could you rephrase?"
    const links = sources.filter((s, i) => sources.findIndex((o) => o.url === s.url) === i).slice(0, 4)
    if (links.length) actions.push({ type: "sources", items: links })

    const answer = await AiMessage.create({ user: me._id, role: "assistant", content: reply, actions })
    res.status(201).json({ question, answer })
  } catch (error) {
    console.log("sendAiMessage error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const clearAiMessages = async (req, res) => {
  try {
    const withImages = await AiMessage.find({ user: req.user._id, "actions.type": "image" }, { actions: 1 })
    await AiMessage.deleteMany({ user: req.user._id })
    // Free the Cloudinary space of pictures Nexa made
    deleteFromCloudinary(withImages.flatMap((m) => m.actions.filter((a) => a?.type === "image" && a.publicId)))
    res.status(200).json({ cleared: true })
  } catch (error) {
    console.log("clearAiMessages error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// ── Create a picture Nexa was asked for ──────────────────────
// Made on the server (utils/imageGen.js, no sign-in for anyone), then kept on Cloudinary
const IMAGES_PER_DAY = Number(process.env.NEXA_IMAGES_PER_DAY) || 15
const imageUse = new Map() // userId -> { day, count }  (resets on restart; the cap protects the shared allowance)
const drawing = new Set()  // action ids being drawn right now

export const createAiImage = async (req, res) => {
  const actionId = String(req.body.actionId || "")
  try {
    const message = await AiMessage.findOne({ _id: req.params.id, user: req.user._id, role: "assistant" })
    const index = message?.actions.findIndex((a) => a?.type === "image" && a.id === actionId) ?? -1
    if (index < 0) return res.status(404).json({ error: "Image not found" })
    if (message.actions[index].url) return res.status(200).json({ action: message.actions[index] })
    if (drawing.has(actionId)) return res.status(409).json({ error: "Already creating this image" })

    const today = new Date().toISOString().slice(0, 10)
    const use = imageUse.get(String(req.user._id))
    const count = use?.day === today ? use.count : 0
    if (count >= IMAGES_PER_DAY) return res.status(429).json({ error: `You've reached today's limit of ${IMAGES_PER_DAY} images. Try again tomorrow.` })

    drawing.add(actionId)
    try {
      const { prompt, shape } = message.actions[index]
      const made = await generateImage(prompt, shape)
      imageUse.set(String(req.user._id), { day: today, count: count + 1 })
      const stored = await uploadToCloudinary({ buffer: made.buffer, mimetype: made.mimetype, originalname: "nexa-image" }, { subfolder: "ai-images", transformation: made.transformation })

      // Re-read: the chat may have changed (or been cleared) while drawing
      const fresh = await AiMessage.findOne({ _id: message._id, user: req.user._id })
      const i = fresh?.actions.findIndex((a) => a?.type === "image" && a.id === actionId) ?? -1
      if (i < 0) {
        deleteFromCloudinary([stored])
        return res.status(404).json({ error: "Image not found" })
      }
      const action = { ...fresh.actions[i], url: stored.url, publicId: stored.publicId, resourceType: "image", width: stored.width, height: stored.height }
      fresh.actions[i] = action
      fresh.markModified("actions")
      await fresh.save()
      res.status(200).json({ action })
    } finally {
      drawing.delete(actionId)
    }
  } catch (error) {
    if (error.cause) console.log("createAiImage error:", error.cause)
    else if (!error.status) console.log("createAiImage error:", error?.message || error)
    res.status(error.status || 500).json({ error: error.status ? error.message : "Couldn't create the image" })
  }
}

// ── Rewrite a draft (the ✨ button in the message box) ─────────
const STYLES = {
  shorten: "Make it shorter and clearer. Keep the meaning and the tone.",
  professional: "Make it professional and polite, suitable for work.",
  friendly: "Make it warm, friendly and casual.",
  grammar: "Fix spelling, grammar and punctuation only. Keep the wording otherwise.",
  english: "Translate it into natural English.",
}

export const rewriteText = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim()
    const instruction = STYLES[req.body.style]
    if (!text) return res.status(400).json({ error: "Type a message first" })
    if (!instruction) return res.status(400).json({ error: "Unknown style" })
    if (text.length > MAX_INPUT) return res.status(400).json({ error: `Please keep it under ${MAX_INPUT} characters` })

    const id = String(req.user._id)
    const now = Date.now()
    recent[id] = (recent[id] || []).filter((t) => now - t < 60_000)
    if (recent[id].length >= LIMIT_PER_MINUTE) return res.status(429).json({ error: "Too many requests. Wait a moment." })
    recent[id].push(now)

    const rewritten = await askGroq([
      {
        role: "system",
        content: `You rewrite chat messages. ${instruction}
Return ONLY the rewritten message: no quotes, no explanations, no options. Keep any names, emoji and links. Write as the same person (first person).`,
      },
      { role: "user", content: text },
    ], { maxTokens: 600, temperature: 0.4 })
    res.status(200).json({ text: rewritten.replace(/^["“]|["”]$/g, "").trim() })
  } catch (error) {
    console.log("rewriteText error:", error.message)
    res.status(503).json({ error: error.message || "Couldn't rewrite that. Try again." })
  }
}

// ── Scheduled messages ─────────────────────────────────────

// My scheduled messages; `?chat=<userId|groupId>` limits it to one chat
export const listScheduled = async (req, res) => {
  try {
    const me = req.user._id
    const filter = { sender: me, status: req.query.all ? { $in: ["pending", "sent", "cancelled", "failed"] } : "pending" }
    if (req.query.chat) {
      const chat = String(req.query.chat)
      filter.$or = String(me) === chat ? [{ receiver: me }] : [{ receiver: chat }, { group: chat }]
    }
    const items = await ScheduledMessage.find(filter).sort({ sendAt: 1 }).limit(100)
      .populate("receiver", "fullName username").populate("group", "name")
    res.status(200).json({ scheduled: items })
  } catch (error) {
    console.log("listScheduled error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const cancelScheduled = async (req, res) => {
  try {
    const job = await ScheduledMessage.findOneAndUpdate(
      { _id: req.params.id, sender: req.user._id, status: "pending" },
      { $set: { status: "cancelled" } },
      { new: true },
    )
    if (!job) return res.status(404).json({ error: "It was already sent or cancelled" })
    emitToUsers([req.user._id], "scheduledUpdated", { id: String(job._id), status: "cancelled" })
    res.status(200).json({ cancelled: String(job._id) })
  } catch (error) {
    console.log("cancelScheduled error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// ── Nexa inside chats ──────────────────────────────────────

// Separate, roomier limits for the quick helpers
const buckets = {}
const allow = (userId, bucket, perMinute) => {
  const key = `${bucket}:${userId}`
  const now = Date.now()
  buckets[key] = (buckets[key] || []).filter((t) => now - t < 60_000)
  if (buckets[key].length >= perMinute) return false
  buckets[key].push(now)
  return true
}
const zoneOf = (req) => safeTimeZone(req.headers["x-time-zone"] || req.body?.timeZone)
const FAST_MODEL = "openai/gpt-oss-20b"

// Pull the first JSON array out of a model reply
const parseList = (text) => {
  const match = String(text).match(/\[[\s\S]*\]/)
  try { return match ? JSON.parse(match[0]) : [] } catch { return [] }
}

export const nexaInfo = async (req, res) => {
  const bot = await getNexaBot()
  res.status(200).json({ botId: String(bot._id), username: bot.username })
}

// 2–3 short replies to the last message someone else sent in this chat
export const smartReplies = async (req, res) => {
  try {
    const me = req.user._id
    if (!allow(me, "smart", 30)) return res.status(200).json({ replies: [] })
    const chat = await readChat(me, String(req.body.chatId || ""), { count: 12, timeZone: zoneOf(req) })
    const last = chat?.messages[chat.messages.length - 1]
    if (!last || String(last.senderId) === String(me) || last.call || !messageText(last).trim()) return res.status(200).json({ replies: [] })

    const text = await askGroq([
      {
        role: "system",
        content: `Suggest 3 short replies the user ("Me") could send to the latest message in this chat.
- Each reply under 8 words, natural and casual, in the same language as the chat.
- Make them different (e.g. yes / no or later / a question). At most one emoji in total.
- Return ONLY a JSON array of 3 strings.`,
      },
      { role: "user", content: chat.lines.join("\n") },
    ], { model: FAST_MODEL, maxTokens: 300, temperature: 0.7 })
    const replies = parseList(text).filter((r) => typeof r === "string" && r.trim()).map((r) => r.trim().slice(0, 80)).slice(0, 3)
    res.status(200).json({ replies, for: String(last._id) })
  } catch (error) {
    console.log("smartReplies error:", error.message)
    res.status(200).json({ replies: [] })
  }
}

// Short summary of the newest messages in a chat ("Catch me up")
export const catchUp = async (req, res) => {
  try {
    const me = req.user._id
    if (!allow(me, "catchup", 10)) return res.status(429).json({ error: "Too many requests. Wait a moment." })
    const unread = Math.min(80, Math.max(3, Number(req.body.count) || 20))
    const chat = await readChat(me, String(req.body.chatId || ""), { count: unread + 6, timeZone: zoneOf(req) })
    if (!chat) return res.status(403).json({ error: "You can't read that chat" })
    if (!chat.lines.length) return res.status(200).json({ summary: "Nothing new here." })
    const summary = await askGroq([
      {
        role: "system",
        content: `Catch the user ("Me") up on ${chat.isGroup ? `the group "${chat.name}"` : `their chat with ${chat.name}`}.
The last ${unread} messages are new to them; earlier ones are context.
Write 2–4 short bullets: what happened, who said what (use names), and anything that needs their reply or decision.
"Me" in the messages is the user: call them "you". No heading, no intro line.`,
      },
      { role: "user", content: chat.lines.join("\n") },
    ], { maxTokens: 500 })
    res.status(200).json({ summary })
  } catch (error) {
    console.log("catchUp error:", error.message)
    res.status(503).json({ error: error.message || "Couldn't summarize right now." })
  }
}

// Translate one message into the reader's language
export const translateMessage = async (req, res) => {
  try {
    const me = req.user._id
    if (!allow(me, "translate", 20)) return res.status(429).json({ error: "Too many requests. Wait a moment." })
    const message = await Message.findById(req.params.id).catch(() => null)
    if (!(await canSeeMessage(me, message))) return res.status(404).json({ error: "Message not found" })
    const source = [message.message, message.transcript].filter(Boolean).join("\n")
    if (!source.trim()) return res.status(400).json({ error: "Nothing to translate" })

    let language = "English"
    try { language = new Intl.DisplayNames(["en"], { type: "language" }).of(String(req.body.language || "en").split("-")[0]) || "English" } catch { /* default */ }
    const text = await askGroq([
      { role: "system", content: `Translate the message into ${language}. If it's already in ${language}, return it unchanged. Return ONLY the translation.` },
      { role: "user", content: source },
    ], { model: FAST_MODEL, maxTokens: 600, temperature: 0.2 })
    res.status(200).json({ text, language })
  } catch (error) {
    console.log("translateMessage error:", error.message)
    res.status(503).json({ error: error.message || "Couldn't translate right now." })
  }
}

// Turn a voice note into text (saved, so everyone in the chat sees it and summaries can use it)
export const transcribeMessage = async (req, res) => {
  try {
    const me = req.user._id
    const message = await Message.findById(req.params.id).catch(() => null)
    if (!(await canSeeMessage(me, message))) return res.status(404).json({ error: "Message not found" })
    const a = message.attachment
    if (!a || !(a.kind === "audio" || a.mimeType?.startsWith("audio/") || a.mimeType?.startsWith("video/"))) return res.status(400).json({ error: "That isn't a voice note" })
    if (message.transcript !== null) return res.status(200).json(message)
    if (!allow(me, "transcribe", 10)) return res.status(429).json({ error: "Too many requests. Wait a moment." })
    if (a.size > 24 * 1024 * 1024) return res.status(400).json({ error: "That recording is too long to transcribe" })

    const file = await fetch(a.url, { signal: AbortSignal.timeout(30_000) })
    if (!file.ok) return res.status(502).json({ error: "Couldn't download the voice note" })
    const audio = Buffer.from(await file.arrayBuffer())
    const text = await groqTranscribe(audio, a.name || "voice.webm", a.mimeType || "audio/webm")
    message.transcript = text || "(no speech detected)"
    await message.save()
    await notifyAudience(message, "messageEdited", message, me)
    res.status(200).json(message)
  } catch (error) {
    console.log("transcribeMessage error:", error.message)
    res.status(503).json({ error: error.message || "Couldn't transcribe right now." })
  }
}

// "Remind me about this": a reminder in my Message yourself chat, linking back to the message
export const remindAboutMessage = async (req, res) => {
  try {
    const me = req.user._id
    const message = await Message.findById(req.params.id).catch(() => null)
    if (!(await canSeeMessage(me, message))) return res.status(404).json({ error: "Message not found" })
    const sendAt = new Date(req.body.sendAt)
    if (Number.isNaN(sendAt.getTime()) || sendAt.getTime() < Date.now() + 15_000) return res.status(400).json({ error: "Pick a time in the future" })
    if (sendAt.getTime() > Date.now() + 366 * 24 * 3600_000) return res.status(400).json({ error: "Reminders can be up to a year ahead" })

    // Where the message lives, and who wrote it
    let chatId, chatName, isGroup = false
    if (message.groupId) {
      const g = await Group.findById(message.groupId).select("name")
      chatId = String(message.groupId); chatName = g?.name || "a group"; isGroup = true
    } else {
      const other = String(message.senderId) === String(me) ? message.receiverId : message.senderId
      chatId = String(other)
      chatName = String(other) === String(me) ? "Message yourself" : (await User.findById(other).select("fullName"))?.fullName || "a chat"
    }
    const author = String(message.senderId) === String(me) ? "you" : (await User.findById(message.senderId).select("fullName"))?.fullName || "someone"
    const snippet = messageText(message).replace(/\s+/g, " ").slice(0, 140)
    const text = isGroup
      ? `⏰ Reminder: "${snippet}" (${author} in ${chatName})`
      : `⏰ Reminder: "${snippet}" (${author === "you" ? `you, to ${chatName}` : `from ${author}`})`

    const job = await ScheduledMessage.create({ sender: me, receiver: me, text, sendAt, ref: { messageId: String(message._id), chatId, isGroup, chatName } })
    emitToUsers([me], "scheduledUpdated", { id: String(job._id), status: "pending" })
    res.status(201).json({ id: String(job._id), sendAt: job.sendAt })
  } catch (error) {
    console.log("remindAboutMessage error:", error.message)
    res.status(500).json({ error: "Couldn't set the reminder" })
  }
}
