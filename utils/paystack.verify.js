
import crypto from "crypto";

/**
 * Verify Paystack webhook signature.
 * @param {Buffer|string} rawBody - raw body string (req.rawBody)
 * @param {string} secret - PAYSTACK_SECRET_KEY
 * @param {string} headerSignature - value of 'x-paystack-signature'
 * @returns {boolean}
 */
export const verifyPaystackSignature = (rawBody, secret, headerSignature) => {
  if (!headerSignature) return false;
  const hmac = crypto.createHmac("sha512", secret);
  const computed = hmac.update(rawBody).digest("hex");
  return computed === headerSignature;
};

/**
 * Parse common fields from a Paystack webhook payload.
 */
export const parsePaystackWebhook = (body) => {
  return {
    event: body.event || body.event_type || null,
    data: body.data || body,
  };
};
