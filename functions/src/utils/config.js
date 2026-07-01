module.exports = {
  // Stored securely in Firebase Secrets Manager
  apiKey: process.env.PAYMOB_API_KEY || "SWJ9WGB9MB-J96H2NL9HW-2R2NMKKDRD",
  hmacToken: process.env.PAYMOB_HMAC_TOKEN || "test_hmac_secret",

  // Configurable integration parameters
  integrationId: Number(process.env.PAYMOB_INTEGRATION_ID || 4536762), // Example sandbox Card integration ID
  iframeId: Number(process.env.PAYMOB_IFRAME_ID || 842186) // Example sandbox iframe template ID
};
