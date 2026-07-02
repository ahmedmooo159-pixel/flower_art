const axios = require("axios");
const logger = require("../logger");

async function authenticate(apiKey) {
  try {
    const response = await axios.post("https://accept-alpha.paymob.com/api/auth/tokens", {
      api_key: apiKey
    });
    return response.data.token;
  } catch (error) {
    logger.error("Paymob Authentication failed", error.response?.data || error.message);
    throw new Error("Paymob authentication failed: " + (error.response?.data?.detail || error.message));
  }
}

module.exports = authenticate;
