import express from "express"
import { getMessage, sendMessage, deleteMessage, editMessage, deleteConversation, markSeen, getConversations, deleteMessages, forwardMessages, reactToMessage } from "../controller/message.controller.js"
import secureRoute from "../middleware/secureRoute.js"
import { uploadSingle } from "../config/cloudinary.js"

const router = express.Router()
router.post("/send/:id", secureRoute, uploadSingle("file"), sendMessage)
router.get("/get/:id", secureRoute, getMessage)
router.delete("/delete/:messageId", secureRoute, deleteMessage)
router.put("/edit/:messageId", secureRoute, editMessage)
router.delete("/conversation/:id", secureRoute, deleteConversation)
router.get("/conversations", secureRoute, getConversations)
router.put("/seen/:id", secureRoute, markSeen)
router.post("/delete-many", secureRoute, deleteMessages)
router.post("/forward", secureRoute, forwardMessages)
router.put("/react/:messageId", secureRoute, reactToMessage)
export default router
