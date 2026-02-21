import express from "express"
import { getMessage, sendMessage, deleteMessage, editMessage, deleteConversation } from "../controller/message.controller.js"
import secureRoute from "../middleware/secureRoute.js"

const router = express.Router()
router.post("/send/:id", secureRoute, sendMessage)
router.get("/get/:id", secureRoute, getMessage)
router.delete("/delete/:messageId", secureRoute, deleteMessage)
router.put("/edit/:messageId", secureRoute, editMessage)
router.delete("/conversation/:id", secureRoute, deleteConversation)
export default router
