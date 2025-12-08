import { Router } from "express";
import { createWallet } from "../Controllers/wallet.controller.js";
import { v4 as uuidv4 } from "uuid";
import Wallet from "../models/wallet.js";
import Transaction from "../models/transaction.model.js"
import Patient from "../models/patient.js";
import PaymentService from "../services/paystack.service.js";
import {authenticatePatient, authenticateAdmin} from "../Middlewares/wallet.middleware.js";



uuidv4();

const walletRouter = Router();

//get balance
walletRouter.get('/balance', authenticatePatient, async (req, res) =>{
    try {
    const wallet = await Wallet.findOne({ patientId: req.patient._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    res.json({ balance: wallet.balance, currency: wallet.currency });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//add fund
walletRouter.post('/fund', authenticatePatient, async(req, res) =>{
    try {
    const { amount } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum amount is ₦100' });

    const wallet = await Wallet.findOne({ patientId: req.patient._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const reference = `WAL-${uuidv4()}`;
    const transaction = await Transaction.create({
      walletId: wallet._id,
      patientId: req.patient._id,
      type: 'credit',
      amount,
      description: 'Wallet funding via Paystack',
      reference,
      status: 'pending'
    });

    const paystackResponse = await paystackService.initializeTransaction({
      email: req.patient.email,
      amount,
      reference,
      callbackUrl: `${process.env.FRONTEND_URL}/wallet/verify?reference=${reference}`
    });

    res.json({ authorizationUrl: paystackResponse.data.authorization_url, reference });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})


//verify payment
walletRouter.get('/verify/:reference', authenticatePatient, async (req, res) => {
  try {
    const { reference } = req.params;
    const transaction = await Transaction.findOne({ reference, patientId: req.patient._id });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (transaction.status === 'success') return res.json({ message: 'Already verified', transaction });

    const verification = await paystackService.verifyTransaction(reference);
    if (verification.data.status === 'success') {
      transaction.status = 'success';
      await transaction.save();

      await Wallet.findByIdAndUpdate(transaction.walletId, { $inc: { balance: transaction.amount } });
      res.json({ message: 'Payment verified', transaction });
    } else {
      transaction.status = 'failed';
      await transaction.save();
      res.status(400).json({ error: 'Payment failed', transaction });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Pay bill from wallet
walletRouter.post('/pay-bill', authenticatePatient, async (req, res) => {
  try {
    const { amount, billId, description } = req.body;
    const wallet = await Wallet.findOne({ patientId: req.patient._id });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    if (wallet.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    wallet.balance -= amount;
    await wallet.save();

    const transaction = await Transaction.create({
      walletId: wallet._id,
      patientId: req.patient._id,
      type: 'debit',
      amount,
      description: description || `Bill payment: ${billId}`,
      reference: `BILL-${uuidv4()}`,
      status: 'success',
      paymentMethod: 'wallet'
    });

    res.json({ message: 'Payment successful', newBalance: wallet.balance, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transaction history
walletRouter.get('/transactions', authenticatePatient, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = { patientId: req.patient._id };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);
    res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: View all wallets
walletRouter.get('/admin/wallets', authenticateAdmin, async (req, res) => {
  try {
    const wallets = await Wallet.find().populate('patientId', 'name email contact');
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: View patient transactions
walletRouter.get('/admin/wallets/:patientId/transactions', authenticateAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




export default walletRouter;
