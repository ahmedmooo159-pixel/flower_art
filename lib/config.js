// ==========================================
//  Paymob Configuration — Vercel Serverless
//  All values read from environment variables
// ==========================================

module.exports = {
  apiKey: process.env.PAYMOB_API_KEY,
  hmacToken: process.env.PAYMOB_HMAC_TOKEN,
  publicKey: process.env.PAYMOB_PUBLIC_KEY,
  secretKey: process.env.PAYMOB_SECRET_KEY,

  // Configurable integration parameters
  integrationId: Number(process.env.PAYMOB_INTEGRATION_ID || 5765248),
  iframeId: Number(process.env.PAYMOB_IFRAME_ID || 1057319)
};
