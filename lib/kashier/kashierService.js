// ==========================================
//  Kashier Payment Service — Vercel Serverless
//  Handles signature generation, payment
//  initiation (Hosted Payment Page), and
//  webhook verification.
// ==========================================

const crypto = require("crypto");
const config = require("../config");
const logger = require("../logger");

// ✅ Kashier Merchant ID (format: MID-XXXXX-XX)
// This is NOT the API Key — it's shown next to your account name
// in the Kashier dashboard.
const KASHIER_MERCHANT_ID = "MID-48245-91";

/**
 * Generate HMAC-SHA256 signature for Kashier Hosted Payment Page.
 * Kashier expects the path "/?payment=MID.ORDER.AMOUNT.CURRENCY"
 * signed with the SECRET KEY (not the API Key) using HMAC-SHA256.
 *
 * @param {object} params
 * @param {string} params.orderId   - Your merchant order ID
 * @param {string} params.amount    - Amount as string (e.g. "500.00")
 * @param {string} params.currency  - Currency code (e.g. "EGP")
 * @returns {string} hex-encoded HMAC signature
 */
function generateSignature({ orderId, amount, currency }) {
  const path = `/?payment=${KASHIER_MERCHANT_ID}.${orderId}.${amount}.${currency}`;
  const signature = crypto
    .createHmac("sha256", config.kashier.secretKey) // must be the Secret Key, not the API Key
    .update(path)
    .digest("hex");

  logger.info("Kashier signature generated", {
    path,
    signature: signature.substring(0, 12) + "..."
  });
  return signature;
}

/**
 * Verify incoming Kashier webhook/callback signature.
 * Uses HMAC-SHA256 on the raw request body, signed with the Secret Key.
 *
 * @param {string} rawBody   - Raw JSON body as string
 * @param {string} signature - Signature from Kashier header or body
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signature) {
  try {
    const calculated = crypto
      .createHmac("sha256", config.kashier.secretKey)
      .update(rawBody)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const calcBuffer = Buffer.from(calculated, "hex");

    if (sigBuffer.length !== calcBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, calcBuffer);
  } catch (err) {
    logger.error("Kashier signature verification error", { message: err.message });
    return false;
  }
}

/**
 * Build the Kashier Hosted Payment Page redirect URL.
 * NOTE: Kashier's Hosted Payment Page does NOT require a POST to an
 * "initiate" API first — you build a signed URL and redirect the
 * customer directly to payments.kashier.io.
 *
 * @param {object} params
 * @param {number} params.amountCents      - Amount in cents (e.g. 7900 = 79.00 EGP)
 * @param {string} params.currency         - Currency code (e.g. "EGP")
 * @param {string} params.merchantOrderId  - Your internal order/payment ID
 * @param {object} params.customer         - { first_name, last_name, email, phone }
 * @returns {Promise<{ kashierOrderId: string, redirectUrl: string }>}
 */
async function initiatePayment({ amountCents, currency, merchantOrderId, customer }) {
  const amountDecimal = (amountCents / 100).toFixed(2);

  logger.info("Kashier payment flow started", {
    amountCents,
    amountDecimal,
    currency,
    merchantOrderId
  });

  const hash = generateSignature({
    orderId: merchantOrderId,
    amount: amountDecimal,
    currency
  });

  const merchantRedirect = process.env.KASHIER_REDIRECT_URL
    || "https://flower-art-opal.vercel.app/thankyou.html";

  const redirectUrl =
    `https://payments.kashier.io/?merchantId=${KASHIER_MERCHANT_ID}` +
    `&orderId=${encodeURIComponent(merchantOrderId)}` +
    `&amount=${amountDecimal}` +
    `&currency=${currency}` +
    `&hash=${hash}` +
    `&merchantRedirect=${encodeURIComponent(merchantRedirect)}` +
    `&mode=test` +
    `&display=en` +
    `&allowedMethods=card` +
    `&customerReference=${encodeURIComponent(customer?.email || "")}`;

  logger.info("Kashier hosted payment URL built", {
    orderId: merchantOrderId,
    redirectUrl
  });

  return {
    kashierOrderId: merchantOrderId,
    redirectUrl
  };
}

module.exports = {
  generateSignature,
  verifyWebhookSignature,
  initiatePayment
};
