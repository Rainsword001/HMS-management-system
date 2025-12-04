import mongoose from "mongoose";


export const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  drugs: [{ name: String, dosage: String, status: { type: String, enum: ['pending', 'dispensed'], default: 'pending' } }],
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;