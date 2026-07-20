const axios = require("axios");
const logger = require("../logger");

async function generatePaymentKey(authToken, amountCents, currency, paymobOrderId, integrationId, customer) {
  try {
    const response = await axios.post("https://accept-alpha.paymob.com/api/acceptance/payment_keys", {
      auth_token: authToken,
      amount_cents: Number(amountCents),
      expiration: 3600,
      order_id: Number(paymobOrderId),
      billing_data: {
        apartment: "NA",
        email: customer.email,
        floor: "NA",
        first_name: customer.first_name || "Customer",
        street: "NA",
        building: "NA",
        phone_number: customer.phone || "+201000000000",
        shipping_method: "NA",
        postal_code: "NA",
        city: "NA",
        country: "EG",
        last_name: customer.last_name || "Customer",
        state: "NA"
      },
      currency: currency,
      integration_id: Number(integrationId),
      lock_order_to_token: true
    });
    return response.data.token;
  } catch (error) {
    logger.error("Paymob Payment Key generation failed", error.response?.data || error.message);
    throw new Error("Paymob payment key generation failed: " + (error.response?.data?.message || error.message));
  }
}

module.exports = generatePaymentKey;
