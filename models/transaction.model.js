import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  reference: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['paystack', 'wallet', 'cash'], default: 'paystack' }
}, { timestamps: true });


const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction;