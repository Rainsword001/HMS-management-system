// models/Prescription.js
import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    // Better to store as ObjectId references (recommended for performance & data integrity)
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true, // for faster queries by patient
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or "Doctor" if you have a separate Doctor model
      required: true,
      index: true,
    },

    // Optional: keep names for quick display (denormalized for performance)
    patientName: { type: String, required: true },
    doctorName: { type: String, required: true },

    // Array of medicines
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true }, // e.g., "500mg"
        frequency: { type: String, required: true }, // e.g., "Twice daily"
        duration: { type: String }, // e.g., "7 days"
        quantity: { type: Number, required: true, min: 1 },
        status: {
          type: String,
          enum: ["pending", "dispensed", "unavailable"],
          default: "pending",
        },
        dispensedAt: { type: Date },
      },
    ],

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true, // gives createdAt & updatedAt
  }
);

// Compound index for common queries
prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;