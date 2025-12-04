import axios from 'axios';
import qs from 'qs';
import NodeCache from 'node-cache';
import {
  MONIFY_API_KEY,
  MONIFY_SECRET_KEY,
  MONIFY_BASE_URL,
    MONIFY_CONTRACT_CODE
} from '../config/env.js';




const tokenCache = new NodeCache();

const loginUrl = `${MONIFY_BASE_URL}/v1/auth/login`;
const initTxUrl = `${MONIFY_BASE_URL}/transactions/init-transaction`;
const verifyTxUrl = (reference) => `${MONIFY_BASE_URL}/transactions/${reference}/verify`;


//get monify token
export const getMonnifyToken = async () => {
  const cached = tokenCache.get("monnify_token");
  if (cached) {
    console.log("Using cached Monnify token");
    return cached};

  const basicAuth = Buffer.from(`${MONIFY_API_KEY}:${MONIFY_SECRET_KEY}`).toString("base64");
  console.log("Basic Auth:", basicAuth);

  const res = await axios.post(loginUrl, {}, {
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.data || !res.data.responseBody?.accessToken) {
    throw new Error("Failed to fetch Monnify token");
  }

  const token = res.data.responseBody.accessToken;
  const expiresIn = res.data.responseBody?.expiresIn || 300; // TTL seconds
  tokenCache.set("monnify_token", token, Math.max(60, expiresIn - 30));
  return token;
};

/**
 * initializeTransaction - returns Monnify checkout URL and paymentReference
 * metadata should include patientId and walletId (so it's easy to reconcile)
 */
//initialize monnify transaction
export const initializeTransaction = async ({ amount, customerName, customerEmail, customerMobile, metadata = {} }) => {
  const token = await getMonnifyToken();

  const payload = {
    amount,
    customerName,
    customerEmail,
    customerMobile,
    paymentReference: `WALLET-${Date.now()}`,
    redirectUrl: metadata.redirectUrl || "", // frontend redirect optional
    contractCode: MONIFY_CONTRACT_CODE,
    currencyCode: "NGN",
    paymentDescription: metadata.paymentDescription || "Wallet Funding",
    // optionally set meta data under "metadata" for your own use if supported
  };

  const res = await axios.post(initTxUrl, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.data || !res.data.responseBody) {
    throw new Error("Monnify init failed");
  }

  return {
    checkoutUrl: res.data.responseBody.checkoutUrl,
    reference: payload.paymentReference,
    raw: res.data
  };
};


//verify monnify transaction
export const verifyTransaction = async (reference) => {
  const token = await getMonnifyToken();
  const res = await axios.get(verifyTxUrl(reference), {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data; // caller to handle response
}