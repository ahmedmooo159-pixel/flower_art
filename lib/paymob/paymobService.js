const authenticate = require("./auth");
const createOrder = require("./createOrder");
const generatePaymentKey = require("./paymentKey");
const config = require("../config");
const logger = require("../logger");

/**
 * Orchestrate the full Paymob payment flow:
 *   1. Authenticate → get auth token
 *   2. Register order → get Paymob order ID
 *   3. Generate payment key → get iframe token
 *
 * @param {object} params
 * @param {number} params.amountCents  - Amount in cents (e.g. 50000 = 500.00 EGP)
 * @param {string} params.currency     - Currency code (e.g. "EGP")
 * @param {string} params.merchantOrderId - Your internal order/payment ID
 * @param {object} params.customer     - { first_name, last_name, email, phone }
 * @returns {Promise<{ paymentToken: string, iframeUrl: string }>}
 */
async function initiatePayment({ amountCents, currency, merchantOrderId, customer }) {
  logger.info("Paymob payment flow started", { amountCents, currency, merchantOrderId });

  // Step 1: Authenticate
  const authToken = await authenticate(config.apiKey);
  logger.info("Paymob auth token obtained");

  // Step 2: Create order
  const paymobOrderId = await createOrder(authToken, amountCents, currency, merchantOrderId);
  logger.info("Paymob order created", { paymobOrderId });

  // Step 3: Generate payment key
  const paymentToken = await generatePaymentKey(
    authToken,
    amountCents,
    currency,
    paymobOrderId,
    config.integrationId,
    customer
  );
  logger.info("Paymob payment key generated");

  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${config.iframeId}?payment_token=${paymentToken}`;

  return {
    paymentToken,
    iframeUrl,
    paymobOrderId
  };
}

module.exports = { initiatePayment };
