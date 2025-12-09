const idempotencyStore = new Map();
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export const checkIdempotency = (key) => {
  const entry = idempotencyStore.get(key);
  if (entry && Date.now() - entry.timestamp < EXPIRY_TIME) {
    return entry.response;
  }
  return null;
};

export const saveIdempotency = (key, response) => {
  idempotencyStore.set(key, {
    response,
    timestamp: Date.now()
  });
};

export const generateIdempotencyKey = (patientId, type, amount) => {
  return `${patientId}-${type}-${amount}-${Math.floor(Date.now() / 60000)}`;
};

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore.entries()) {
    if (now - entry.timestamp > EXPIRY_TIME) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Cleanup every hour
