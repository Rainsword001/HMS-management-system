// src/services/wallet.service.js
import  axios from 'axios';
import Wallet from '../models/wallet.js';
import Transaction from '../models/transaction.model.js'
import Patient from '../models/patient.js'
import { checkIdempotency, saveIdempotency } from '../utils/idempotency.js';
import { PAYSTACK_SECRET_KEY, PAYSTACK_BASE_URL,  } from '../config/env.js';



const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Create Paystack customer
const createPaystackCustomer = async (patient) => {
  try {
    const response = await paystackApi.post('/customer', {
      email: patient.email,
      name: patient.name,
      phone: patient.phone
    });
    return response.data.data;
  } catch (error) {
    throw new Error(`Failed to create Paystack customer: ${error.response?.data?.message || error.message}`);
  }
};

// Create Dedicated Virtual Account (DVA)
export const createVirtualAccount = async (patient) => {
  try {
    // First create customer
    const customer = await createPaystackCustomer(patient);
    
    // Then create dedicated virtual account
    const response = await paystackApi.post('/dedicated_account', {
      customer: customer.customer_code,
      preferred_bank: 'wema-bank' // Options: wema-bank, titan-paystack, globus-bank
    });
    
    const dva = response.data.data;
    
    return {
      accountNumber: dva.account_number,
      accountName: dva.account_name,
      bankName: dva.bank.name,
      bankCode: dva.bank.slug,
      customerId: customer.customer_code,
      dedicatedAccountId: dva.id,
      provider: 'paystack'
    };
  } catch (error) {
    console.error('Virtual account creation error:', error.response?.data || error.message);
    throw new Error(`Failed to create virtual account: ${error.response?.data?.message || error.message}`);
  }
};

// Initialize payment transaction
export const initializePayment = async (patientId, amount, callbackUrl) => {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');
  
  const reference = `WAL_${patientId}_${Date.now()}`;
  
  try {
    const response = await paystackApi.post('/transaction/initialize', {
      email: patient.email,
      amount: amount * 100, // Convert to kobo
      reference,
      callback_url: callbackUrl,
      metadata: {
        patientId: patientId.toString(),
        type: 'wallet_funding',
        custom_fields: [
          {
            display_name: 'Patient ID',
            variable_name: 'patient_id',
            value: patient.patientId
          }
        ]
      }
    });
    
    // Create pending transaction
    await Transaction.create({
      wallet: patient.wallet,
      type: 'credit',
      amount,
      description: 'Wallet funding via Paystack',
      reference,
      status: 'pending',
      paymentMethod: 'paystack',
      metadata: { paystackReference: reference }
    });
    
    return {
      authorizationUrl: response.data.data.authorization_url,
      accessCode: response.data.data.access_code,
      reference
    };
  } catch (error) {
    throw new Error(`Payment initialization failed: ${error.response?.data?.message || error.message}`);
  }
};

// Verify payment and credit wallet
export const verifyPayment = async (reference) => {
  // Check idempotency
  const existingTransaction = await Transaction.findOne({ 
    reference, 
    status: 'completed' 
  });
  if (existingTransaction) {
    return { success: true, message: 'Transaction already processed', transaction: existingTransaction };
  }
  
  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    const data = response.data.data;
    
    if (data.status !== 'success') {
      await Transaction.findOneAndUpdate(
        { reference },
        { status: 'failed', metadata: { paystackResponse: data } }
      );
      throw new Error('Payment was not successful');
    }
    
    const amount = data.amount / 100; // Convert from kobo
    const patientId = data.metadata?.patientId;
    
    if (!patientId) throw new Error('Patient ID not found in transaction metadata');
    
    const patient = await Patient.findById(patientId);
    if (!patient) throw new Error('Patient not found');
    
    // Credit wallet
    const wallet = await Wallet.findByIdAndUpdate(
      patient.wallet,
      { $inc: { balance: amount } },
      { new: true }
    );
    
    // Update transaction
    const transaction = await Transaction.findOneAndUpdate(
      { reference },
      {
        status: 'completed',
        balanceAfter: wallet.balance,
        metadata: { 
          paystackReference: data.reference,
          paystackId: data.id,
          paidAt: data.paid_at
        }
      },
      { new: true }
    );
    
    return { success: true, wallet, transaction };
  } catch (error) {
    throw new Error(`Payment verification failed: ${error.response?.data?.message || error.message}`);
  }
};

// Handle Paystack webhook for DVA transfers
export const handleWebhook = async (event, data) => {
  if (event === 'charge.success') {
    const reference = data.reference;
    
    // Check if already processed
    const existing = await Transaction.findOne({ reference, status: 'completed' });
    if (existing) return { success: true, message: 'Already processed' };
    
    // For DVA transfers
    if (data.channel === 'dedicated_nuban') {
      const customerCode = data.customer?.customer_code;
      const patient = await Patient.findOne({ 'virtualAccount.customerId': customerCode });
      
      if (!patient) {
        console.error('Patient not found for customer:', customerCode);
        return { success: false, message: 'Patient not found' };
      }
      
      const amount = data.amount / 100;
      
      // Credit wallet
      const wallet = await Wallet.findByIdAndUpdate(
        patient.wallet,
        { $inc: { balance: amount } },
        { new: true }
      );
      
      // Create transaction record
      await Transaction.create({
        wallet: patient.wallet,
        type: 'credit',
        amount,
        description: `Bank transfer to virtual account`,
        reference,
        status: 'completed',
        paymentMethod: 'bank_transfer',
        balanceAfter: wallet.balance,
        metadata: {
          senderBank: data.authorization?.bank,
          senderName: data.authorization?.sender_name,
          accountNumber: patient.virtualAccount.accountNumber
        }
      });
      
      return { success: true, message: 'Wallet credited via bank transfer' };
    }
    
    // For regular Paystack payments
    return await verifyPayment(reference);
  }
  
  return { success: true, message: 'Event not handled' };
};

// Debit wallet (for paying invoices)
export const debitWallet = async (patientId, amount, description, invoiceId = null, idempotencyKey = null) => {
  if (idempotencyKey) {
    const isDuplicate = await checkIdempotency(idempotencyKey);
    if (isDuplicate) throw new Error('Duplicate transaction');
  }
  
  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');
  
  const wallet = await Wallet.findById(patient.wallet);
  if (!wallet) throw new Error('Wallet not found');
  
  if (wallet.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  
  wallet.balance -= amount;
  await wallet.save();
  
  const transaction = await Transaction.create({
    wallet: wallet._id,
    type: 'debit',
    amount,
    description,
    reference: `DEB_${patientId}_${Date.now()}`,
    status: 'completed',
    paymentMethod: 'wallet',
    balanceAfter: wallet.balance,
    relatedInvoice: invoiceId,
    metadata: { invoiceId }
  });
  
  if (idempotencyKey) await saveIdempotency(idempotencyKey);
  
  return { wallet, transaction };
};

// Get wallet balance
export const getBalance = async (patientId) => {
  const patient = await Patient.findById(patientId).populate('wallet');
  if (!patient || !patient.wallet) throw new Error('Wallet not found');
  return patient.wallet;
};

// Get transaction history
export const getTransactions = async (walletId, options = {}) => {
  const { page = 1, limit = 20, type, status } = options;
  const query = { wallet: walletId };
  
  if (type) query.type = type;
  if (status) query.status = status;
  
  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
    
  const total = await Transaction.countDocuments(query);
  
  return { transactions, total, page, pages: Math.ceil(total / limit) };
};

// Get virtual account details
export const getVirtualAccount = async (patientId) => {
  const patient = await Patient.findById(patientId).select('virtualAccount patientId name');
  if (!patient) throw new Error('Patient not found');
  return patient.virtualAccount;
};

