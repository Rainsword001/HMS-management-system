import mongoose from "mongoose";

export const patientSchema = new mongoose.Schema({
   name:{
        type:String,
        required:[true, "Name is required"],
        trim:true
    },
    age: {
        type: Number,
        required: [true, "Age is required"],
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: [true, "Gender is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/\S+.\S+@\S+/, "Please fill a valid email address"]
    },
    password:{
        type: String,
        required:true,
        trim:true,
        min: [6, "Must be at least 6 characters"]
    },
    contact: {
        type: String,
        required: [true, "Contact number is required"],
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, "Please fill a valid contact number"]
    },
    admissiondate: {
        type: Date,
        default: Date.now
    },
    admissionward: {
        type: String,
        required: [true, "Admission ward is required"],
        trim: true,
        enum: ["male ward", "female ward", "private"]
    },
    status: {
        type: String,
        enum: ["admitted", "discharged", "under observation"],
        default: "under observation"
    }
}, {timestamps: true})



const Patient = mongoose.model('Patient', patientSchema)

export default Patient;

