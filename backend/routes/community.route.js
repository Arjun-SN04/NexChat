import express from "express"
import secureRoute from "../middleware/secureRoute.js"
import {
  listCommunities, createCommunity, getCommunity, updateCommunity, deleteCommunity,
  addCommunityMembers, removeCommunityMember, setCommunityAdmin, createCommunityGroup,
} from "../controller/community.controller.js"

const router = express.Router()
router.use(secureRoute)
router.get("/", listCommunities)
router.post("/", createCommunity)
router.get("/:id", getCommunity)
router.put("/:id", updateCommunity)
router.delete("/:id", deleteCommunity)
router.post("/:id/members", addCommunityMembers)
router.delete("/:id/members/:userId", removeCommunityMember)
router.put("/:id/admins/:userId", setCommunityAdmin)
router.post("/:id/groups", createCommunityGroup)
export default router
