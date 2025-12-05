import mongoose from "mongoose";


export const paystackSchema = new mongoose.Schema({
    full_name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    reference:{
        type:String,
        required: true,
        unique: true
    },
    status:{
        type: String,
        required: true
    }
})


const Payments = mongoose.model("Payments", paystackSchema)


export default Payments