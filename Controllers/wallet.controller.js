import {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getBalance,
  getTransactions,
  getVirtualAccount
} from '../services/wallet.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { FRONTEND_URL } from '../config/env.js';


// Initialize payment
export const initializePayments = async (req, res) => {
  try {
    const { amount } = req.body;
    const callbackUrl = `${FRONTEND_URL}/wallet/verify`;
    
    const result = await initializePayment(req.patient._id, amount, callbackUrl);
    sendSuccess(res, 200, 'Payment initialized', result);
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// Verify payment
export const verifyPayments = async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await verifyPayment(reference);
    sendSuccess(res, 200, 'Payment verified', result);
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// Paystack webhook
export const handleWebhooks = async (req, res) => {
  try {
    const hash = require('crypto')
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
      return sendError(res, 401, 'Invalid signature');
    }
    
    const { event, data } = req.body;
    await handleWebhook(event, data);
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(200); // Always return 200 to Paystack
  }
};

// Get wallet balance
export const getBalances = async (req, res) => {
  try {
    const wallet = await getBalance(req.patient._id);
    sendSuccess(res, 200, 'Wallet balance retrieved', wallet);
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// Get transaction history
export  const getTransactionsHistory = async (req, res) => {
  try {
    const { page, limit, type, status } = req.query;
    const wallet = await getBalance(req.patient._id);
    const result = await getTransactions(wallet._id, { page, limit, type, status });
    sendSuccess(res, 200, 'Transactions retrieved', result);
  } catch (error) {
    sendError(res, 400, error.message);
  }
};

// Get virtual account details
export const getVirtualAccounts = async (req, res) => {
  try {
    const virtualAccount = await getVirtualAccount(req.patient._id);
    sendSuccess(res, 200, 'Virtual account retrieved', virtualAccount);
  } catch (error) {
    sendError(res, 400, error.message);
  }
};
