import mongoose from "mongoose";

const dispensedItemSchema = new mongoose.Schema({
  drugName: { type: String, required: true },
  batchNumber: { type: String },
  expiryDate: { type: Date },
  quantityDispensed: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  instructions: { type: String }
});

const pharmacyDispenseSchema = new mongoose.Schema({
  dispenseNumber: { type: String, unique: true },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [dispensedItemSchema],
  totalAmount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'partial'],
    default: 'pending'
  },
  paymentMethod: { type: String, enum: ['wallet', 'cash', 'card', 'invoice'] },
  dispensedAt: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

pharmacyDispenseSchema.pre('save', function(next) {
  if (!this.dispenseNumber) {
    this.dispenseNumber = `PHM-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

const PharmacyDispense = mongoose.model('PharmacyDispense', pharmacyDispenseSchema);

export default PharmacyDispense;
