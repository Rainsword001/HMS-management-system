// routes/prescription.routes.js
import {Router} from "express";
import {
  createPrescription,
  getPrescriptionById,
  getPrescriptionsByPatient,
  getPendingPrescriptions,
  dispensePrescription,
  getAllPrescriptionsAdmin,
  deletePrescription,
  getPrescriptionAudit,
} from "../controllers/prescription.controller.js";
import { verifyToken, authorizeRole} from "../Middlewares/auth.middlewares.js";


const prescriptionRouter = Router();

prescriptionRouter.use(verifyToken);

// Doctor Routes
prescriptionRouter.post("/", authorizeRole("doctor"), createPrescription);
prescriptionRouter.get("/:id", getPrescriptionById);
prescriptionRouter.get("/patient/:patientId", authorizeRole("doctor", "patient", "pharmacy", "admin"), getPrescriptionsByPatient);

// Pharmacy Routes
prescriptionRouter.get("/pending", authorizeRole("pharmacy", "admin"), getPendingPrescriptions);
prescriptionRouter.put("/:id/dispense", authorizeRole("pharmacy", "admin"), dispensePrescription);

// Admin Routes
prescriptionRouter.get("/", authorizeRole("admin"), getAllPrescriptionsAdmin);
prescriptionRouter.delete("/:id", authorizeRole("admin"), deletePrescription);
prescriptionRouter.get("/:id/audit", authorizeRole("admin", "pharmacy"), getPrescriptionAudit);

export default prescriptionRouter;