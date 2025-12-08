import { Router } from "express";
import {  createPatient, logIn, getPatient, updatePatient, deletePatient, getAllPatients} from "../Controllers/patient.controller.js";
import { verifyToken, authorizeRole} from "../Middlewares/auth.middlewares.js";
import {authenticatePatient} from '../Middlewares/wallet.middleware.js'

const patientRouter = Router();



// Get Patient by ID - Accessible by 'admin', 'doctor', and 'nurse'
patientRouter.get('/:patientId', verifyToken, authorizeRole('admin', 'doctor', 'nurse'), getPatient);

//get all patients - Accessible by 'admin', 'doctor', and 'nurse'
patientRouter.get('/get', verifyToken, authorizeRole('admin', 'doctor', 'nurse'), getAllPatients);

// Create Patient - Accessible by 'admin' and 'doctor'
patientRouter.post('/', verifyToken, authorizeRole('admin', 'doctor'), createPatient);

// Patient Login
patientRouter.post('/login', logIn)

// Update Patient - Accessible by 'admin' and 'doctor'
patientRouter.put('/:patientId', verifyToken, authorizeRole('admin', 'doctor'), updatePatient);

// Delete Patient - Accessible by 'admin' only
patientRouter.delete('/:patientId', verifyToken, authorizeRole('admin'), deletePatient);

export default patientRouter;
