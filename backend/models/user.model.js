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
    // Public handle people use to find you: lowercase letters, numbers, _ and .
    username:{
        type:String,
        unique:true,
        sparse:true,
        lowercase:true,
        trim:true
    },
    // The built-in Nexa assistant account (posts @Nexa answers in groups; can't log in)
    isBot:{ type:Boolean, default:false },
    // People I can chat with (always mutual)
    contacts:[{ type:mongoose.Schema.Types.ObjectId, ref:"User" }],
    // Secret part of my invite link / QR code. Opening it adds me instantly.
    inviteToken:{
        type:String,
        unique:true,
        sparse:true
    },
    // Profile photo stored on Cloudinary (null = show initials)
    avatar:{
        type:{ url:String, publicId:String },
        default:null
    }
},{timestamps:true}) 


const User = mongoose.model("User",userSchema)

export default User