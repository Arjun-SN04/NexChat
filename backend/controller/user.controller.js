import Createtoken from "../jwt/token.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { io } from "../socket/socket.js"

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
    io.emit("newUserJoined", { _id: newUser._id, fullName: newUser.fullName, email: newUser.email })
    return res.status(201).json({ message: "Signed up successfully", newUser })
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
    return res.status(200).json({ message: "Logged in successfully", user })
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
    const allUsers = await User.find({ _id: { $ne: loggedInUser } }).select("-password")
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
    const updatedUser = await User.findById(userId).select("-password")
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
