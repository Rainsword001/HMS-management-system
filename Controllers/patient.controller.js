// controllers/patient.controller.js

import Patient from "../models/patient.js";
import Wallet from "../models/wallet.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";
import { createVirtualAccount } from "../services/wallet.service.js";

export const createPatient = async (req, res) => {
  try {
    const { name, age, gender, email, password, contact, admissionward } = req.body;

    // 1. Validate required fields
    if (!name || !age || !gender || !email || !password || !contact || !admissionward) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2. Check if patient exists
    const existingPatient = await Patient.findOne({ email: email.toLowerCase() });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient with this email already exists",
      });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create patient
    const patient = await Patient.create({
      name: name.trim(),
      age: Number(age),
      gender,
      email: email.toLowerCase(),
      password: hashedPassword,
      contact,
      admissionward,
    });

    // 5. Create wallet
    const wallet = await Wallet.create({
      patientId: patient._id,
      balance: 0,
    });

    // Link wallet
    patient.wallet = wallet._id;

    // 6. Create virtual account (Paystack) – don't break flow if it fails
    try {
      const virtualAccountData = await createVirtualAccount({
        email: patient.email,
        name: patient.name,
      });

      patient.virtualAccount = {
        accountNumber: virtualAccountData.account_number || virtualAccountData.accountNumber,
        bankName: virtualAccountData.bank?.name || virtualAccountData.bankName,
        accountName: virtualAccountData.account_name || virtualAccountData.accountName,
      };
    } catch (paystackError) {
      console.error('Paystack virtual account failed:', paystackError.message);
      // Continue anyway – can retry later
    }

    // 7. Save updated patient (wallet + virtual account)
    await patient.save();

    // 8. Generate correct token ← THIS WAS YOUR MAIN BUG
    const token = jwt.sign(
      { patientId: patient._id },  // ← use `patient._id`, NOT `Patient._id`
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 9. Remove password from response
    const patientResponse = patient.toObject();
    delete patientResponse.password;

    // 10. Send success with token
    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
      token,                    // ← NOW FRONTEND CAN LOG IN
      data: {
        patient: patientResponse
      }
    });

  } catch (error) {
    console.error("Create Patient Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create patient",
      error: process.env.NODE_ENV === 'development' ? error.message : "Server error"
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




export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .select("name age gender contact createdAt admissionward status") // only these fields
      .sort({ createdAt: -1 }) // newest first
      .lean(); // faster

    // Map to clean, readable format
    const patientList = patients.map(patient => ({
      id: patient._id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      admissionDate: patient.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
      admissionWard: patient.admissionward,
      status: patient.status
    }));

    res.status(200).json({
      success: true,
      count: patientList.length,
      data: patientList
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients"
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


