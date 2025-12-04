// controllers/virtualAccount.controller.js
import VirtualAccount from "../models/virtualAccount.js";
import { createReservedAccount } from "../services/monify.ser.js";

export const generatePatientVirtualAccount = async (patient) => {
  try {
    const accountData = await createReservedAccount(patient);

    const saved = await VirtualAccount.create({
      patientId: patient._id,
      accountReference: accountData.accountReference,
      customerName: accountData.customerName,
      customerEmail: accountData.customerEmail,
      accounts: accountData.accounts,
    });

    return saved;
  } catch (e) {
    console.error("Error generating Monnify virtual account:", e);
    throw e;
  }
};


