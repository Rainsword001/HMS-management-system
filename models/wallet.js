import mongoose from "mongoose";



export const transactionShema = new mongoose.Schema({
    patientid:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },
    type: {
        type: String,
        enum: ["deposit", "withdrawal", "deduction"],
        required: true
    },
    amount:{
        type: Number,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
    method:{
        type: String,
        enum: ["Debit / Credit_Card", "bank_transfer", "USSD", "Pay_Point", "online_payment"],
        required: true
    },
    statu:{
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    },
})



export const walletSchema = new mongoose.Schema({
    patientid:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
        unique: true
    },
    balance:{
        type: Number,
        default: 0
    },
    transactions:[transactionShema]
}, { timestamps: true });

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;