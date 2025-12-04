import Wallet from "../models/wallet.js";
import Patient from "../models/patient.js";



//create wallet for patient
export const createWallet = async (patientId) => {
  try {
    const wallet = await Wallet.create({
      patient: patientId,
      balance: 0,
      transactions: [],
    });

    return wallet;
  } catch (error) {
    console.error("Create Wallet Error:", error);
    throw new Error("Failed to create wallet");
  }
};


// get wallet by patient ID
export const getWalletByPatientId = async (req, res) => {
    try {
        const { patientId } = req.query;
        const wallet = await Wallet.findOne({ patient: patientId });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found for this patient." });
        }
        res.status(200).json(wallet);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};