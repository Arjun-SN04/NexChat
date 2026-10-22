import express from "express"
import { allUser, usernameAvailable, login, logout, signup, updateProfile, getMe, updateAvatar, removeAvatar } from "../controller/user.controller.js"
import { uploadAvatarSingle } from "../config/cloudinary.js"
import secureRoute from "../middleware/secureRoute.js"

const router = express.Router()
router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", logout)
router.get("/allusers", secureRoute, allUser)
router.get("/username-available/:username", usernameAvailable)
router.put("/update", secureRoute, updateProfile)
router.get("/me", secureRoute, getMe)
router.put("/avatar", secureRoute, uploadAvatarSingle("avatar"), updateAvatar)
router.delete("/avatar", secureRoute, removeAvatar)
export default router
