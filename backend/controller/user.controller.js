import Createtoken from "../jwt/token.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { io } from "../socket/socket.js"
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js"

// Never send password hashes to the browser
const publicUser = (user) => {
  const { password, confirmPassword, __v, ...rest } = user.toObject ? user.toObject() : user
  return rest
}

export const signup = async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body
  try {
    if (password !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match" })
    const existing = await User.findOne({ email })
    if (existing)
      return res.status(400).json({ error: "User already exists" })
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = new User({ fullName, email, password: hashedPassword })
    await newUser.save()
    Createtoken(newUser._id, res)
    // Notify all connected clients that a new user has joined
    io.emit("newUserJoined", publicUser(newUser))
    return res.status(201).json({ message: "Signed up successfully", newUser: publicUser(newUser) })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ error: "User not found" })
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ error: "Invalid password" })
    Createtoken(user._id, res)
    return res.status(200).json({ message: "Logged in successfully", user: publicUser(user) })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const logout = (req, res) => {
  try {
    res.clearCookie("jwt")
    res.status(200).json({ message: "Logged out successfully" })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const allUser = async (req, res) => {
  try {
    const loggedInUser = req.user._id
    const allUsers = await User.find({ _id: { $ne: loggedInUser } }).select("-password -confirmPassword")
    res.status(200).json({ allUsers })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id
    const { fullName, currentPassword, newPassword } = req.body
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    if (fullName) user.fullName = fullName

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password)
      if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" })
      user.password = await bcrypt.hash(newPassword, 10)
    }

    await user.save()
    const updatedUser = publicUser(await User.findById(userId))
    if (fullName) io.emit("userUpdated", updatedUser) // name changes show up for everyone
    res.status(200).json({ message: "Profile updated successfully", user: updatedUser })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user)
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
}

// Upload or replace my profile photo
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Please choose an image" })
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: "User not found" })

    const uploaded = await uploadToCloudinary(req.file, { subfolder: "avatars" })
    const old = user.avatar
    user.avatar = { url: uploaded.url, publicId: uploaded.publicId }
    await user.save()
    // Free the old photo's storage
    if (old?.publicId) await deleteFromCloudinary([{ publicId: old.publicId, resourceType: "image" }])

    const updated = publicUser(user)
    io.emit("userUpdated", updated)
    res.status(200).json({ message: "Profile photo updated", user: updated })
  } catch (error) {
    console.log("updateAvatar error:", error?.message || error)
    res.status(500).json({ error: "Could not update your photo. Try again." })
  }
}

// Remove my profile photo (back to initials)
export const removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ error: "User not found" })
    const old = user.avatar
    user.avatar = null
    await user.save()
    if (old?.publicId) await deleteFromCloudinary([{ publicId: old.publicId, resourceType: "image" }])

    const updated = publicUser(user)
    io.emit("userUpdated", updated)
    res.status(200).json({ message: "Profile photo removed", user: updated })
  } catch (error) {
    console.log("removeAvatar error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
