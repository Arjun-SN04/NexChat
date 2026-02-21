import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
 const secureRoute =async (req,res,next) => {
  try {
    const token = req.cookies.jwt
    if(!token){
        return res.status(401).json({error:"No token unauthorzed access"})
    }
    const decoded = jwt.verify(token,process.env.token)
    if(!decoded){
        return res.status(401).json({error:"token not decoded"})
    }
    const user = await User.findById(decoded.user_id).select("-password")
    if(!user){
        return res.status(401).json({error:"user not found"})
    }
    req.user =user
    next()
    
  } catch (error) {
    console.log(error);
    
  }
}

export default secureRoute