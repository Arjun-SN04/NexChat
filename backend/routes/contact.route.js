import express from "express"
import secureRoute from "../middleware/secureRoute.js"
import {
  getContacts, lookupUser, sendRequest, getRequests, acceptRequest, removeRequest,
  removeContact, getMyInvite, resetInvite, previewInvite, acceptInvite,
} from "../controller/contact.controller.js"

const router = express.Router()
router.use(secureRoute)
router.get("/", getContacts)
router.get("/lookup/:username", lookupUser)
router.get("/requests", getRequests)
router.post("/requests", sendRequest)
router.post("/requests/:id/accept", acceptRequest)
router.delete("/requests/:id", removeRequest)
router.get("/invite", getMyInvite)
router.post("/invite/reset", resetInvite)
router.get("/invite/:token", previewInvite)
router.post("/invite/:token", acceptInvite)
router.delete("/:userId", removeContact)
export default router
