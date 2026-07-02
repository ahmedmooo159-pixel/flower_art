const crypto = require("crypto");
const logger = require("../logger");

/**
 * Verify Paymob HMAC callback signature.
 * Paymob concatenates specific fields from the callback in a fixed order,
 * then computes HMAC-SHA512 using your HMAC secret.
 *
 * @param {object} obj  - The transaction object from Paymob callback
 * @param {string} hmac - The hmac query-string value sent by Paymob
 * @param {string} hmacSecret - Your HMAC secret from Paymob dashboard
 * @returns {boolean}
 */
function verifyHmac(obj, hmac, hmacSecret) {
  // Paymob HMAC concatenation order (alphabetical by key name)
  const fields = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order.id",
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "source_data.type",
    "success"
  ];

  // Build the concatenated string from the transaction object
  const concatenated = fields.map((field) => {
    const parts = field.split(".");
    let value = obj;
    for (const part of parts) {
      value = value?.[part];
    }
    // Paymob sends booleans as true/false strings
    if (typeof value === "boolean") return value.toString();
    return String(value ?? "");
  }).join("");

  const computed = crypto
    .createHmac("sha512", hmacSecret)
    .update(concatenated)
    .digest("hex");

  const isValid = computed === hmac;
  if (!isValid) {
    logger.warn("HMAC verification failed", { expected: computed, received: hmac });
  }
  return isValid;
}

module.exports = { verifyHmac };
