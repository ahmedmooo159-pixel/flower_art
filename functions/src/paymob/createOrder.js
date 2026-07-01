const axios = require("axios");
const logger = require("../utils/logger");

async function createOrder(authToken, amountCents, currency, merchantOrderId) {
  try {
    const response = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
      auth_token: authToken,
      delivery_needed: "false",
      amount_cents: String(amountCents),
      currency: currency,
      merchant_order_id: String(merchantOrderId),
      items: []
    });
    return response.data.id;
  } catch (error) {
    logger.error("Paymob Order Creation failed", error.response?.data || error.message);
    throw new Error("Paymob order creation failed: " + (error.response?.data?.message || error.message));
  }
}

module.exports = createOrder;
