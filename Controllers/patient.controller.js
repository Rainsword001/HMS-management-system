import Patient from "../models/patient.js";
import { createPaystackCustomer, createDedicatedAccount } from "../services/paystack.service.js";
import VirtualAccount from "../models/virtualAccount.js";

// Create Patient Controller
export const createPatient = async (req, res) => {
  try {
    const { name, age, gender, email, contact, admissionward } = req.body;

    if (!name || !age || !gender || !email || !contact || !admissionward) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check if patient already exists
    const userExists = await Patient.findOne({ name });
    if (userExists) {
      return res.status(400).json({
        message: "Patient already exists",
      });
    }
  // Create new patient
    const newPatient = await Patient.create({
      name,
      age,
      gender,
      email,
      contact,
      admissionward,
    });

    await newPatient.save();

    
    // ✔ Automatically create wallet for the patient
    // 1. Create Paystack Customer
    
        const customer = await createPaystackCustomer({
        email: newPatient.email || `${newPatient._id}@patients.local`,
        first_name: newPatient.firstName || newPatient.name?.split(' ')[0] || newPatient.name,
        last_name: newPatient.lastName || newPatient.name?.split(' ').slice(1).join(' ') || ""
        });

        const dva = await createDedicatedAccount({ customer: customer.id, preferred_bank: "wema-bank" });

        // Persist mapping to DB (save accountNumber(s) inside accounts array)
        await VirtualAccount.create({
        patientId: newPatient._id,
        accountReference: dva.reference || dva.account_reference || `PAT-${newPatient._id}`,
        customerId: customer.id,
        accounts: [{
            bankName: dva.bank || dva.provider || dva.bank_name || "Unknown",
            accountNumber: dva.account_number || dva.accountNumber || dva.account_number,
            provider: dva.provider || dva.provider_slug || null,
        }],
        walletId: wallet._id
        });

    return res.status(201).json({
      message: "Patient created successfully",
      patient: newPatient,
      VirtualAccount,
    });

  } catch (error) {
    console.error("Create Patient Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



// Get All Patient
export const getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            total: patients.length,
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
export const getPatient = async (req, res, next) => {
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


