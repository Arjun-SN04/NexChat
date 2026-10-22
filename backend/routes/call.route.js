import express from "express"
import secureRoute from "../middleware/secureRoute.js"
import { clearCalls, listCalls } from "../controller/call.controller.js"

const router = express.Router()
router.use(secureRoute)
router.get("/", listCalls)
router.delete("/", clearCalls)
export default router
