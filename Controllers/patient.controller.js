import Patient from "../models/patient.js";
import Wallet from "../models/wallet.js";

export const createPatient = async (req, res) => {
  try {
    const { name, age, gender, email, contact, admissionward } = req.body;

    // Validate
    if (!name || !age || !gender || !email || !contact || !admissionward) {
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

    // Create patient
    const newPatient = await Patient.create({
      name,
      age,
      gender,
      email,
      contact,
      admissionward,
    });

    // Create wallet for patient
    const wallet = await Wallet.create({
      patientId: newPatient._id,
      balance: 0,
    });

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


