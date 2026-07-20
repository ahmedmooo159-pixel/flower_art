// ==========================================
//  Kashier Payment Service — Vercel Serverless
//  Handles signature generation, payment
//  initiation, and webhook verification.
// ==========================================

const crypto = require("crypto");
const axios = require("axios");
const config = require("../config");
const logger = require("../logger");

/**
 * Generate HMAC-SHA256 signature for Kashier API requests.
 * Kashier expects the path "/?payment=MID.ORDER.AMOUNT.CURRENCY"
 * signed with the secret key using HMAC-SHA256.
 *
 * @param {object} params
 * @param {string} params.merchantId  - Kashier public key (MID)
 * @param {string} params.orderId     - Your merchant order ID
 * @param {string} params.amount      - Amount as string (e.g. "500.00")
 * @param {string} params.currency    - Currency code (e.g. "EGP")
 * @returns {string} hex-encoded HMAC signature
 */
function generateSignature({ merchantId, orderId, amount, currency }) {
  const path = `/?payment=${merchantId}.${orderId}.${amount}.${currency}`;
  const signature = crypto
    .createHmac("sha256", config.kashier.secretKey)
    .update(path)
    .digest("hex");

  logger.info("Kashier signature generated", { path, signature: signature.substring(0, 12) + "..." });
  return signature;
}

/**
 * Verify incoming Kashier webhook/callback signature.
 * Uses HMAC-SHA256 on the raw request body.
 *
 * @param {string} rawBody     - Raw JSON body as string
 * @param {string} signature   - Signature from Kashier header or body
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signature) {
  try {
    const calculated = crypto
      .createHmac("sha256", config.kashier.secretKey)
      .update(rawBody)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
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
 * Initiate a payment session with Kashier API.
 *
 * @param {object} params
 * @param {number} params.amountCents      - Amount in cents (e.g. 7900 = 79.00 EGP)
 * @param {string} params.currency         - Currency code (e.g. "EGP")
 * @param {string} params.merchantOrderId  - Your internal order/payment ID
 * @param {object} params.customer         - { first_name, last_name, email, phone }
 * @returns {Promise<{ kashierOrderId: string, redirectUrl: string }>}
 */
async function initiatePayment({ amountCents, currency, merchantOrderId, customer }) {
  const merchantId = config.kashier.publicKey;
  const apiEndpoint = config.kashier.apiEndpoint;

  // Convert cents to decimal amount string (e.g. 7900 → "79.00")
  const amountDecimal = (amountCents / 100).toFixed(2);

  logger.info("Kashier payment flow started", {
    amountCents,
    amountDecimal,
    currency,
    merchantOrderId
  });

  // Generate order hash/signature
  const hash = generateSignature({
    merchantId,
    orderId: merchantOrderId,
    amount: amountDecimal,
    currency
  });

  // Build payment request payload
  // const payload = {
  //   merchantId,
  //   orderId: merchantOrderId,
  //   amount: amountDecimal,
  //   currency,
  //   hash,
  //   customer: {
  //     name: `${customer.first_name} ${customer.last_name}`.trim(),
  //     email: customer.email,
  //     phone: customer.phone || ""
  //   },
  //   redirectUrl: process.env.KASHIER_REDIRECT_URL || "https://ahmedmooo159-pixel.github.io/antigravity/thankyou.html",
  //   webhookUrl: process.env.KASHIER_WEBHOOK_URL || ""
  // };
  const payload = {
  merchantId,
  orderId: merchantOrderId,
  amount: amountDecimal,
  currency,
  hash,
  merchantRedirect: process.env.KASHIER_REDIRECT_URL || "https://flower-art-opal.vercel.app/thankyou.html", // ✅ إضافة
  customer: {
    name: `${customer.first_name} ${customer.last_name}`.trim(),
    email: customer.email,
    phone: customer.phone || ""
  },
  redirectUrl: process.env.KASHIER_REDIRECT_URL || "https://flower-art-opal.vercel.app/thankyou.html",
  webhookUrl: process.env.KASHIER_WEBHOOK_URL || ""
};

  logger.info("Kashier payment request payload", {
    merchantId,
    orderId: merchantOrderId,
    amount: amountDecimal
  });

  try {
    const response = await axios.post(
      `${apiEndpoint}/payment/initiate`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": config.kashier.publicKey
        }
      }
    );

    const data = response.data;
    logger.info("Kashier payment response", {
      status: data.status,
      kashierOrderId: data.response?.orderId || merchantOrderId
    });

    // Kashier returns a redirect URL for the hosted checkout page
    const kashierOrderId = data.response?.orderId || merchantOrderId;
    const redirectUrl = data.response?.redirectUrl
      || data.response?.paymentUrl
      || `https://checkout.kashier.io/?merchantId=${merchantId}&orderId=${merchantOrderId}&amount=${amountDecimal}&currency=${currency}&hash=${hash}&mode=test`;

    return {
      kashierOrderId,
      redirectUrl
    };
  } catch (error) {
    const errData = error.response?.data || error.message;
    logger.error("Kashier payment initiation failed", { error: errData });

    // Fallback: build the hosted checkout URL directly
    // This allows the integration to work even if the API endpoint
    // is different or returns an unexpected format
    // const fallbackUrl = `https://checkout.kashier.io/?merchantId=${merchantId}&orderId=${merchantOrderId}&amount=${amountDecimal}&currency=${currency}&hash=${hash}&mode=test&display=en`;
    const fallbackUrl = `https://checkout.kashier.io/?merchantId=${merchantId}&orderId=${merchantOrderId}&amount=${amountDecimal}&currency=${currency}&hash=${hash}&merchantRedirect=${encodeURIComponent(process.env.KASHIER_REDIRECT_URL || "https://flower-art-opal.vercel.app/thankyou.html")}&mode=test&display=en`;
    logger.info("Using Kashier fallback checkout URL", { fallbackUrl });

    return {
      kashierOrderId: merchantOrderId,
      redirectUrl: fallbackUrl
    };
  }
}

module.exports = {
  generateSignature,
  verifyWebhookSignature,
  initiatePayment
};
