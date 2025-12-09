import Patient from "../models/patient.js";
import Wallet from "../models/wallet.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

export const createPatient = async (req, res) => {
  try {
    const { name, age, gender, email, password, contact, admissionward } = req.body;

    // Validate input
    if (!name || !age || !gender || !email || !password || !contact || !admissionward) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check if patient already exists (email is better)
    const userExists = await Patient.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: "Patient already exists",
      });
    }

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt)

    // Create patient
    const newPatient = await Patient.create({
      name,
      age,
      gender,
      email,
      password: hashPassword,
      contact,
      admissionward,
    });

    // Create wallet for patient
    const wallet = await Wallet.create({
      patientId: newPatient._id,
      balance: 0,
    });

    //generate token
    const token = await jwt.sign({ patientId: Patient._id}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN})

    return res.status(201).json({
      message: "Patient created successfully",
      patient: newPatient,
      wallet, // helpful to return
    });

  } catch (error) {
    console.error("Create Patient Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export const logIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // Check for existing user
    const existUser = await Patient.findOne({ email });

    if (!existUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, existUser.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    // Generate token
    const token = jwt.sign(
      { patientId: existUser._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      message: "Login successful",
      success: true,
      token,
      patient: {
        name: existUser.name,
        email: existUser.email,
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};


// Get All Patient
export const getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [patients, total] = await Promise.all([
      Patient.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Patient.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      message: "Patients retrieved successfully",
      page,
      limit,
      total,
      data: patients
    });

  } catch (error) {
    console.error("Get All Patients Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve patients"
    });
  }
};



//get all patients
export const getPatientById = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findById(patientId).populate('userId').populate('walletId');
        if(!patient){
            return res.status(404).json({  
                message: "Patient not found"
            });
        }
        return res.status(200).json({
            patient
        });
    } catch (error) {
        console.error("Get Patient Error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Update Patient Controller
export const updatePatient = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const updates = req.body;
        const updatedPatient = await Patient.findByIdAndUpdate(patientId, updates, { new: true });
        if(!updatedPatient){
            return res.status(404).json({
                message: "Patient not found"
            });
        }
        return res.status(200).json({
            message: "Patient updated successfully",
            patient: updatedPatient
        });
    }
    catch (error) {
        console.error("Update Patient Error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// Delete Patient Controller
export const deletePatient = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const deletedPatient = await Patient.findByIdAndDelete(patientId);
        if(!deletedPatient){
            return res.status(404).json({
                message: "Patient not found"
            });
        }
        return res.status(200).json({
            message: "Patient deleted successfully"
        });
    } catch (error) {
        console.error("Delete Patient Error:", error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


