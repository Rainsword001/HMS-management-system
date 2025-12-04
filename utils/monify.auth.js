import axios from "axios";
import {
  MONIFY_API_KEY,
  MONIFY_SECRET_KEY,
  MONIFY_BASE_URL,
} from "../config/env.js";

export const getMonnifyToken = async () => {
  try {
    const authString = Buffer.from(
      `${MONIFY_API_KEY}:${MONIFY_SECRET_KEY}`
    ).toString("base64");

    const response = await axios.post(
      `${MONIFY_BASE_URL}/api/v1/auth/login`,
      {}, // Must be empty JSON, Monnify rejects null
      {
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.requestSuccessful) {
      console.error("Monnify Login Failed:", response.data);
      throw new Error(response.data.responseMessage);
    }

    return response.data.responseBody.accessToken;

  } catch (error) {
    console.error(
      "Monnify Auth Error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to authenticate Monnify");
  }
};
