// src/models/virtualAccount.js
import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  accountReference: String,
  customerId: String, // paystack customer id
  accounts: [
    {
      bankName: String,
      accountNumber: String,
      provider: String,
      providerSlug: String,
    }
  ],
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" }, // link to your wallet doc
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("VirtualAccount", accountSchema);
