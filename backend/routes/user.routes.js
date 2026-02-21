import express from "express"
import { allUser, login, logout, signup, updateProfile, getMe } from "../controller/user.controller.js"
import secureRoute from "../middleware/secureRoute.js"

const router = express.Router()
router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", logout)
router.get("/allusers", secureRoute, allUser)
router.put("/update", secureRoute, updateProfile)
router.get("/me", secureRoute, getMe)
export default router
