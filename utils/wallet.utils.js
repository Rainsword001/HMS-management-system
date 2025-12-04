// src/utils/wallet.utils.js
import mongoose from "mongoose";
import Wallet from "../models/wallet.js";
import PaymentTransaction from "../models/walletTransaction.js"; // optional; used for idempotency checks

// Helpers to generate account/wallet ids (keep same logic as your model defaults if any)
const generateWalletId = () => `WAL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
const generateAccountNumber = () => `${Math.floor(1000000000 + Math.random() * 9000000000)}`;

/**
 * createWallet(patientid)
 * - creates a wallet document for a patient
 */
export const createWallet = async (patientid) => {
  if (!patientid) throw new Error("patientid is required");

  const existing = await Wallet.findOne({ patientid });
  if (existing) return existing;

  const wallet = await Wallet.create({
    patientid,
    walletId: generateWalletId(),
    accountNumber: generateAccountNumber(),
    balance: 0,
    transactions: []
  });

  return wallet;
};

/**
 * getWalletByPatientId(patientid)
  */
export const getWalletByPatientId = async (patientid) => {
  if (!patientid) throw new Error("patientid is required");
  return Wallet.findOne({ patientid });
};

/**
 * getWalletById(walletId)
 */
export const getWalletById = async (walletId) => {
  if (!walletId) throw new Error("walletId is required");
  return Wallet.findById(walletId);
};

/**
 * _checkIdempotency(transactionRef)
 * If a transactionRef is provided and present in PaymentTransaction (or paymentLog),
 * we consider the operation already applied.
 */
const _checkIdempotency = async (transactionRef) => {
  if (!transactionRef) return false;
  try {
    const tx = await PaymentTransaction.findOne({ reference: transactionRef });
    return !!(tx && tx.status === "paid");
  } catch (err) {
    // if PaymentTransaction model doesn't exist or lookup fails, do not block operation
    return false;
  }
};

/**
 * creditWallet(walletId, amount, description, options)
 * - amount must be > 0
 * - options.transactionRef (string) used for idempotency check
 * - returns updated wallet
 */
export const creditWallet = async (walletId, amount, description = "credit", options = {}) => {
  if (!walletId) throw new Error("walletId is required");
  if (typeof amount !== "number" || amount <= 0) throw new Error("amount must be a positive number");

  // idempotency: if transactionRef already processed, just return current wallet
  if (options.transactionRef) {
    const already = await _checkIdempotency(options.transactionRef);
    if (already) return Wallet.findById(walletId);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) throw new Error("Wallet not found");

    wallet.balance = Number((wallet.balance + amount).toFixed(2));
    const tx = {
      type: "credit",
      amount,
      description,
      date: new Date(),
      balanceAfter: wallet.balance,
      ref: options.transactionRef || null
    };

    wallet.transactions.push(tx);
    await wallet.save({ session });

    // optionally mark PaymentTransaction as paid (if transactionRef present)
    if (options.transactionRef) {
      try {
        await PaymentTransaction.findOneAndUpdate(
          { reference: options.transactionRef },
          { $set: { status: "paid", walletId: wallet._id, amount } },
          { upsert: false, session }
        );
      } catch (err) {
        // swallow - payment model optional
      }
    }

    await session.commitTransaction();
    session.endSession();

    return wallet;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * debitWallet(walletId, amount, description, options)
 * - amount must be > 0 and <= balance
 * - options.transactionRef for idempotency (if tx already applied, returns wallet)
 */
export const debitWallet = async (walletId, amount, description = "debit", options = {}) => {
  if (!walletId) throw new Error("walletId is required");
  if (typeof amount !== "number" || amount <= 0) throw new Error("amount must be a positive number");

  // idempotency check: if transactionRef exists and already processed, return wallet
  if (options.transactionRef) {
    const already = await _checkIdempotency(options.transactionRef);
    if (already) return Wallet.findById(walletId);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) throw new Error("Wallet not found");

    if (wallet.balance < amount) throw new Error("Insufficient funds");

    wallet.balance = Number((wallet.balance - amount).toFixed(2));
    const tx = {
      type: "debit",
      amount,
      description,
      date: new Date(),
      balanceAfter: wallet.balance,
      ref: options.transactionRef || null
    };

    wallet.transactions.push(tx);
    await wallet.save({ session });

    // optionally mark PaymentTransaction as used/consumed etc
    if (options.transactionRef) {
      try {
        await PaymentTransaction.findOneAndUpdate(
          { reference: options.transactionRef },
          { $set: { status: "used", walletId: wallet._id, amount } },
          { upsert: false, session }
        );
      } catch (err) {
        // swallow
      }
    }

    await session.commitTransaction();
    session.endSession();

    return wallet;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * transferBetweenWallets(fromWalletId, toWalletId, amount, description)
 * - Atomic transfer using mongoose session
 */
export const transferBetweenWallets = async (fromWalletId, toWalletId, amount, description = "transfer") => {
  if (!fromWalletId || !toWalletId) throw new Error("both walletIds are required");
  if (fromWalletId === toWalletId) throw new Error("cannot transfer to same wallet");
  if (typeof amount !== "number" || amount <= 0) throw new Error("amount must be a positive number");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const fromWallet = await Wallet.findById(fromWalletId).session(session);
    const toWallet = await Wallet.findById(toWalletId).session(session);

    if (!fromWallet || !toWallet) throw new Error("one or both wallets not found");
    if (fromWallet.balance < amount) throw new Error("insufficient funds in source wallet");

    fromWallet.balance = Number((fromWallet.balance - amount).toFixed(2));
    toWallet.balance = Number((toWallet.balance + amount).toFixed(2));

    const debitTx = {
      type: "debit",
      amount,
      description: `${description} -> ${toWalletId}`,
      date: new Date(),
      balanceAfter: fromWallet.balance
    };
    const creditTx = {
      type: "credit",
      amount,
      description: `${description} <- ${fromWalletId}`,
      date: new Date(),
      balanceAfter: toWallet.balance
    };

    fromWallet.transactions.push(debitTx);
    toWallet.transactions.push(creditTx);

    await fromWallet.save({ session });
    await toWallet.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { fromWallet, toWallet };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * recalcWalletBalance(walletId)
 * - recalculates balance from transactions (useful for sync)
 */
export const recalcWalletBalance = async (walletId) => {
  if (!walletId) throw new Error("walletId is required");
  const wallet = await Wallet.findById(walletId);
  if (!wallet) throw new Error("Wallet not found");

  const computed = wallet.transactions.reduce((acc, tx) => {
    return tx.type === "credit" ? acc + Number(tx.amount) : acc - Number(tx.amount);
  }, 0);

  wallet.balance = Number(computed.toFixed(2));
  await wallet.save();
  return wallet;
};
