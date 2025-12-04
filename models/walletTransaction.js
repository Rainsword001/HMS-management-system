// src/modules/payments/models/PaymentTransaction.js
import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true }, // paymentReference from Monnify
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  provider: { type: String, default: "monnify" },
  status: { type: String, enum: ["initiated","paid","failed","reconciled"], default: "initiated" },
  raw: { type: mongoose.Schema.Types.Mixed }, // store raw payload for audit
}, { timestamps: true });

export default mongoose.model("PaymentTransaction", paymentTransactionSchema);
