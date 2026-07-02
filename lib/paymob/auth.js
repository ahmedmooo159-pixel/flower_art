const axios = require("axios");
const logger = require("../logger");

async function authenticate(apiKey) {
  try {
    const response = await axios.post(
      "https://accept-alpha.paymob.com/api/auth/tokens",
      {
        api_key: apiKey
      }
    );

    return response.data.token;

  } catch (error) {
    console.error("========== PAYMOB AUTH ERROR ==========");
    console.error("Status:", error.response?.status);
    console.error("Response:", JSON.stringify(error.response?.data, null, 2));
    console.error("API Key exists:", !!apiKey);
    console.error("API Key length:", apiKey ? apiKey.length : 0);
    console.error("=======================================");

    throw new Error(
      "Paymob authentication failed"
    );
  }
}

module.exports = authenticate;
