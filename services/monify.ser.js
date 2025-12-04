import axios from "axios";
import { getMonnifyToken } from "../utils/monify.auth.js";
import { MONIFY_CONTRACT_CODE, MONIFY_BASE_URL } from "../config/env.js";

export const createReservedAccount = async (patient) => {
  try {
    const token = await getMonnifyToken();

    console.log("Monnify CODE:", MONIFY_CONTRACT_CODE);

    const payload = {
      accountReference: `PAT-${patient._id}`,
      accountName: patient.name,
      customerEmail: patient.email || `${patient._id}@hospital.com`,
      customerName: patient.name,
      currencyCode: "NGN",
      contractCode: MONIFY_CONTRACT_CODE,
      getAllAvailableBanks: true,
      preferredBanks: ["035", "232"]
    };

    const response = await axios.post(
      `${MONIFY_BASE_URL}/api/v1/bank-transfer/reserved-accounts`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.requestSuccessful) {
      throw new Error(response.data.responseMessage);
    }

    return response.data.responseBody;
  } catch (error) {
    console.error(
      "Monnify Reserved Account Error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to create virtual Monnify account");
  }
};
