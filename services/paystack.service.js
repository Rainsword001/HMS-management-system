import axios from "axios";
import { PAYSTACK_BASE_URL, PAYSTACK_SECRET_KEY } from "../config/env.js";




const api = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json"
  }
});


export const createPaystackCustomer = async ({ email, first_name, last_name, phone }) => {
  // Paystack create customer API
  const payload = { email, first_name, last_name, phone };
  const res = await api.post("/customer", payload);
  // res.data.status && res.data.data contains customer
  return res.data.data;
};

export const createDedicatedAccount = async ({ customer, preferred_bank = null, currency = "NGN", split_code = null }) => {
  // customer can be customer id or object with id
  const payload = {
    customer: typeof customer === "string" ? customer : customer.id || customer.customer_code,
    preferred_bank,
    currency,
    split: split_code ? { subaccount: split_code } : undefined,
  };

  // Remove undefined keys
  Object.keys(payload).forEach(k => payload[k] == null && delete payload[k]);

  const res = await api.post("/dedicated_account", payload);
  return res.data.data;
};

export const fetchAvailableProviders = async () => {
  const res = await api.get("/dedicated_account/available_providers");
  return res.data.data;
};

export const requeryDedicatedAccount = async ({ account_number, provider_slug, date }) => {
  const params = { account_number, provider_slug, date };
  const res = await api.get("/dedicated_account/requery", { params });
  return res.data.data;
};

export const verifyTransaction = async (reference) => {
  const res = await api.get(`/transaction/verify/${encodeURIComponent(reference)}`);
  return res.data; // res.data.data has transaction details
};