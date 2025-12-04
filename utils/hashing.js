import crypto from "crypto-js";

export const sha512 = (payload) => {
  return crypto.createHash("sha512").update(payload, "utf8").digest("hex");
};

// Monnify requires hashing: SHA512(clientSecret + JSONstringifiedBody) (no spaces)
// We'll expose a helper for that usage.
export const monnifyHash = (clientSecret, bodyObj) => {
  const body = JSON.stringify(bodyObj);
  return sha512(clientSecret + body);
};