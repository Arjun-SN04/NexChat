import mongoose from "mongoose";
const conversation = mongoose.Schema({
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"

        }
    ],
    messages : [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Message",
            default:[]
        }
    ]
} ,{timestamps:true} )
export const Conversation = mongoose.model("Conversation" , conversation)