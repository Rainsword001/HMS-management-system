// src/controllers/paystack.webhook.controller.js
import PaymentLog from "../models/paymentLog.js";
import VirtualAccount from "../models/virtualAccount.js";
import { verifyPaystackSignature, parsePaystackWebhook } from "../utils/paystack.verify.js";
import { creditWallet } from "../utils/wallet.utils.js";
import { PAYSTACK_SECRET_KEY } from "../config/env.js";

export const paystackWebhookHandler = async (req, res) => {
  try {
    const headerSig = req.headers["x-paystack-signature"];
    const raw = req.rawBody || JSON.stringify(req.body);

    if (!verifyPaystackSignature(raw, PAYSTACK_SECRET_KEY, headerSig)) {
      console.warn("Invalid Paystack signature");
      return res.status(401).send("Invalid signature");
    }

    const { event, data } = parsePaystackWebhook(req.body);

    // We only care about successful charges (and dedicated account incoming transfers)
    // Typical event: 'charge.success' when money is received
    if (event !== "charge.success" && event !== "transfer.success") {
      // respond 200 to acknowledge other events but ignore
      return res.status(200).send("Ignored event");
    }

    // Extract useful fields
    const reference = data.reference || data.transaction;
    const amount = (data.amount || data.amount_paid || data?.amount) / 100 || 0; // Paystack amounts are in kobo
    // account number may be in data.receipt or data.allocated_account or data['metadata'] etc.
    // Paystack charge for bank transfer to DVA includes 'recipient' or 'authorization' objects.
    // Best: check data.domain, data.gateway_response, data.customer, data.transaction_date
    const accountNumber =
      data?.recipient?.account_number ||
      data?.received_at_account ||
      data?.metadata?.account_number ||
      data?.authorization?.account_number ||
      data?.destination_account_number ||
      null;

    // Log idempotency - ensure we don't process same reference twice
    const existing = await PaymentLog.findOne({ transactionReference: reference });
    if (existing) {
      console.warn("Duplicate webhook ignored", reference);
      return res.status(200).send("Already processed");
    }

    // Store raw log (for auditing)
    await PaymentLog.create({
      transactionReference: reference,
      amount,
      paidBy: data?.customer?.email || data?.customer?.email || data?.customer?.email || null,
      accountNumber,
      eventType: event,
      rawData: req.body,
    });

    // Find virtual account to map to patient
    if (!accountNumber) {
      console.error("No account number in webhook payload - store for manual reconciliation");
      return res.status(200).send("No account number");
    }

    const vAcc = await VirtualAccount.findOne({ "accounts.accountNumber": accountNumber });
    if (!vAcc) {
      console.error("No virtual account mapped for:", accountNumber);
      return res.status(200).send("No mapping");
    }

    // Credit patient's wallet; pass transactionRef for idempotency
    // Use wallet.utils.creditWallet which supports transactionRef guard
    await creditWallet(vAcc.walletId || vAcc.wallet, Number(amount), `Paystack DVA funding - ${reference}`, {
      transactionRef: reference,
    });

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Paystack webhook error:", err);
    return res.status(500).send("Server error");
  }
};
