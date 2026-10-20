import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
    },
    confirmPassword:{
        type:String,

    },
    // Profile photo stored on Cloudinary (null = show initials)
    avatar:{
        type:{ url:String, publicId:String },
        default:null
    }
},{timestamps:true}) 


const User = mongoose.model("User",userSchema)

export default User