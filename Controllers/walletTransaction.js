import PaymentTransaction from "../models/walletTransaction.js"; // your existing PaymentTransaction model
import { initializeTransaction } from "./monnify.service.js";
import Wallet from "../models/wallet.js"; // your existing Wallet modelc



export const initFundWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    // pull patient and wallet from server-side (don't trust frontend)
    const patientId = req.user.id;
    const wallet = await Wallet.findOne({ patientid: patientId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    // create an "initiated" transaction record (idempotency & bookkeeping)
    const paymentReference = `WALLET-${Date.now()}`;
    await PaymentTransaction.create({
      reference: paymentReference,
      amount,
      walletId: wallet._id,
      patientId,
      status: "initiated",
      raw: { initiatedBy: req.user.id }
    });

    // initialize with Monnify (pass customer data from server side)
    const { checkoutUrl, reference, raw } = await initializeTransaction({
      amount,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerMobile: req.user.phone || req.user.contact || "",
      metadata: {
        walletId: wallet._id,
        patientId,
        paymentDescription: "Wallet top-up",
        redirectUrl: process.env.FRONTEND_PAYMENT_REDIRECT || ""
      }
    });

    // update raw response for audit
    await PaymentTransaction.findOneAndUpdate({ reference: paymentReference }, {
      $set: { raw, reference }
    });

    res.json({ success: true, checkoutUrl, reference: paymentReference });
  } catch (err) {
    console.error("Init Fund Wallet:", err);
    res.status(500).json({ message: "Initialization failed" });
  }
};