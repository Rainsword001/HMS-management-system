import PaymmentTransaction from '../models/walletTransaction.js'; // your existing PaymentTransaction model
import Wallet from '../models/wallet.js'; // your existing Wallet model
import { monnifyHash } from '../utils/hashing.js';
import {verifyTransaction} from '../utils/hashing.js';
import {creditWallet} from '../utils/wallet.utils.js';
import { MONIFY_SECRET_KEY } from '../config/env.js';



/**
 * Webhook handler for Monnify
 * - verifies signature
 * - re-verifies transaction status via Monnify verify endpoint
 * - checks idempotency and credits the wallet
 */
export const monnifyWebhookHandler = async (req, res) => {
  try {
    // 1) verify signature header (Monnify sends a hash header, often 'monnify-signature' or similar)
    const incomingSignature = req.headers["monnify-signature"] || req.headers["x-monnify-signature"];

    if (!incomingSignature) {
      console.warn("No monnify signature header present");
      return res.status(400).send("Missing signature");
    }

    // IMPORTANT: use raw body for hashing — ensure you configure express to provide raw body
    // If using express.json(), you must capture raw body in middleware. For simplicity, assume req.rawBody exists.
    const rawBody = (req.rawBody && req.rawBody.toString()) || JSON.stringify(req.body);

    const computed = monnifyHash(MONIFY_SECRET_KEY, JSON.parse(rawBody)); // or monnifyHash accepts object
    if (computed !== incomingSignature) {
      console.warn("Invalid monnify signature", { computed, incomingSignature });
      return res.status(400).send("Invalid signature");
    }

    // 2) extract event data
    const event = req.body;
    const eventData = event.eventData || event;

    const paymentReference = eventData.paymentReference || eventData.transactionReference || eventData.paymentReference;
    if (!paymentReference) {
      console.warn("No payment reference in webhook", eventData);
      return res.status(400).send("No reference");
    }

    // 3) idempotency: check PaymentTransaction
    const existing = await PaymmentTransaction.findOne({ reference: paymentReference });
    if (existing && existing.status === "paid") {
      // already processed
      return res.status(200).send("Already processed");
    }

    // 4) verify transaction with Monnify server-to-server
    const verification = await verifyTransaction(paymentReference);
    const verificationBody = verification?.responseBody;

    if (!verificationBody || verificationBody.paymentStatus !== "PAID") {
      // not paid; mark failed or ignore
      await PaymmentTransaction.findOneAndUpdate(
        { reference: paymentReference },
        { $set: { status: "failed", raw: { webhook: eventData, verification } } },
        { upsert: true }
      );
      return res.status(400).send("Payment not successful");
    }

    // 5) At this point transaction is PAID — credit wallet
    // Determine walletId & patientId (prefer metadata if you passed)
    const metadata = verificationBody?.metaData || {}; // if you passed metadata during init
    const walletId = metadata.walletId || (existing && existing.walletId);
    const patientId = metadata.patientId || (existing && existing.patientId);
    const amount = verificationBody.amountPaid || verificationBody.amount;

    if (!walletId) {
      console.error("Missing walletId; cannot credit - reference:", paymentReference);
      // Save raw for manual reconciliation
      await PaymmentTransaction.findOneAndUpdate(
        { reference: paymentReference },
        { $set: { status: "failed", raw: { webhook: eventData, verification } } },
        { upsert: true }
      );
      return res.status(500).send("Missing wallet");
    }

    // Use your wallet credit logic - this should also be idempotent
    await creditWallet(walletId, amount, `Monnify funding ${paymentReference}`);

    // mark transaction paid
    await PaymmentTransaction.findOneAndUpdate(
      { reference: paymentReference },
      {
        $set: {
          status: "paid",
          amount,
          walletId,
          patientId,
          raw: { webhook: eventData, verification }
        }
      },
      { upsert: true }
    );

    // return 200 quickly
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Monnify webhook error:", err);
    return res.status(500).send("Server error");
  }
};