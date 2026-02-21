import jwt from "jsonwebtoken"
const Createtoken = (user_id,res)=>{
    const token = jwt.sign({user_id},process.env.token,{expiresIn: "10d" })
    res.cookie("jwt",token,{
          httpOnly: true,
        // secure:true,
        sameSite:"strict"
    })
}
export default Createtoken