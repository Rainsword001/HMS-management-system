import mongoose from "mongoose";


export const staffSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Name is required"],
        trim:true
    },
    email: {
        type: String, 
        unique: true,
        required: [true, "Email is required"],
        trim: true,
        match: [/\S+@\S+.\S+/], 
        lowercase: true, 
        index: true
    },
    password:{
        type:String,
        required:true,
        minLength:6
    },
    role: { 
        type: String, 
        enum: ["doctor", "nurse", "pharmacist", "lab", "admin", "finance"], 
        default: "admin",
        required: true
    },
     status: { type: String, enum: ["active", "inactive"], default: "active" }
},{timestamps:true})


const Staff = mongoose.model('Staff', staffSchema)

export default Staff;