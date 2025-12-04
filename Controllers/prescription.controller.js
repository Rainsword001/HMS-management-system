// controllers/prescription.controller.js
import Prescription from "../models/Prescription.js";
import Patient from "../models/patient.js";

// ──────────────────────
// DOCTOR ACTIONS
// ──────────────────────

// POST /api/prescriptions → Create prescription (Doctor only)
export const createPrescription = async (req, res) => {
  try {
    const { patientId, medicines, notes } = req.body;

    // Validate required fields
    if (!patientId) {
      return res.status(400).json({ message: "Patient ID is required" });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: "Medicines list is required" });
    }

    // Check patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Create prescription
    const prescription = await Prescription.create({
      patient: patientId,
      patientName: patient.name?.trim(),
      doctor: req.user?.id,
      doctorName: req.user?.name || req.user?.username || "Unknown Doctor",
      medicines: medicines.map(med => ({
        name: med.name?.trim(),
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration || "",
        quantity: med.quantity,
        status: "pending",
      })),
      notes: notes || "",
    });

    return res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: prescription,
    });

  } catch (error) {
    console.error("Create Prescription Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create prescription",
      error: error.message,
    });
  }
};

// GET /api/prescriptions/:id → View one prescription (Doctor, Doctor, Pharmacy, Patient)
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patient", "name age gender")
      .populate("doctor", "name specialty");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const allowed = [
      req.user.role === "admin",
      prescription.doctor._id.toString() === req.user.id,
      prescription.patient._id.toString() === req.user.id,
      req.user.role === "pharmacy"
    ].some(Boolean);

    if (!allowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ success: true, data: prescription });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────
// PHARMACY ACTIONS
// ──────────────────────

// GET /api/prescriptions/pending → All pending prescriptions
export const getPendingPrescriptions = async (req, res) => {
  try {
    if (req.user.role !== "pharmacy" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Pharmacy access only" });
    }

    const prescriptions = await Prescription.find({
      "medicines.status": "pending"
    })
      .populate("patient", "name")
      .populate("doctor", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/prescriptions/:id/dispense → Dispense all or specific medicines
export const dispensePrescription = async (req, res) => {
  try {
    if (req.user.role !== "pharmacy" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Pharmacy access required" });
    }

    const { medicineIndexes = [] } = req.body; // array of indexes to dispense, empty = all

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    const now = new Date();

    if (medicineIndexes.length === 0) {
      // Dispense ALL pending medicines
      prescription.medicines.forEach(med => {
        if (med.status === "pending") {
          med.status = "dispensed";
          med.dispensedAt = now;
          med.dispensedBy = req.user.id;
        }
      });
    } else {
      // Dispense only selected ones
      medicineIndexes.forEach(index => {
        if (prescription.medicines[index]) {
          const med = prescription.medicines[index];
          if (med.status === "pending") {
            med.status = "dispensed";
            med.dispensedAt = now;
            med.dispensedBy = req.user.id;
          }
        }
      });
    }

    // Optional: Update overall status
    const hasPending = prescription.medicines.some(m => m.status === "pending");
    prescription.status = hasPending ? "active" : "dispensed";

    await prescription.save();

    res.json({
      success: true,
      message: "Medicines dispensed successfully",
      data: prescription,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Dispense failed" });
  }
};

// ──────────────────────
// ADMIN / AUDIT ACTIONS
// ──────────────────────

// GET /api/prescriptions → All prescriptions (Admin only)
export const getAllPrescriptionsAdmin = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

  try {
    const prescriptions = await Prescription.find()
      .populate("patient", "name")
      .populate("doctor", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/prescriptions/:id → Delete (Admin only)
export const deletePrescription = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    res.json({ success: true, message: "Prescription deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

// GET /api/prescriptions/:id/audit → Simple audit trail
export const getPrescriptionAudit = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .select("createdAt updatedAt medicines.status medicines.dispensedAt medicines.dispensedBy doctor patient")
      .populate("medicines.dispensedBy", "name")
      .populate("doctor", "name")
      .populate("patient", "firstname lastname");

    if (!prescription) return res.status(404).json({ message: "Not found" });

    res.json({
      success: true,
      audit: {
        createdBy: prescription.doctor?.name,
        createdAt: prescription.createdAt,
        lastUpdated: prescription.updatedAt,
        medicines: prescription.medicines.map(m => ({
          name: m.name,
          status: m.status,
          dispensedAt: m.dispensedAt,
          dispensedBy: m.dispensedBy?.name || null,
        })),
      },
      data: prescription,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};