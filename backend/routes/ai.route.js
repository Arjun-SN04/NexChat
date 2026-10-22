import express from "express"
import secureRoute from "../middleware/secureRoute.js"
import {
  cancelScheduled, catchUp, clearAiMessages, getAiMessages, listScheduled, nexaInfo, remindAboutMessage,
  rewriteText, sendAiMessage, smartReplies, transcribeMessage, translateMessage,
} from "../controller/ai.controller.js"

const router = express.Router()
router.use(secureRoute)
router.get("/messages", getAiMessages)
router.post("/messages", sendAiMessage)
router.delete("/messages", clearAiMessages)
router.post("/rewrite", rewriteText)
router.get("/scheduled", listScheduled)
router.delete("/scheduled/:id", cancelScheduled)
router.get("/bot", nexaInfo)
router.post("/smart-replies", smartReplies)
router.post("/catch-up", catchUp)
router.post("/translate/:id", translateMessage)
router.post("/transcribe/:id", transcribeMessage)
router.post("/remind/:id", remindAboutMessage)
export default router
