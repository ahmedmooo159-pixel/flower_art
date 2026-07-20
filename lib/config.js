// ==========================================
//  Payment Configuration — Vercel Serverless
//  Paymob + Kashier — All values from env vars
// ==========================================

module.exports = {
  // ---- Paymob (root-level keys kept for backward compatibility) ----
  apiKey: process.env.PAYMOB_API_KEY,
  hmacToken: process.env.PAYMOB_HMAC_TOKEN,
  publicKey: process.env.PAYMOB_PUBLIC_KEY,
  secretKey: process.env.PAYMOB_SECRET_KEY,
  integrationId: Number(process.env.PAYMOB_INTEGRATION_ID || 5765248),
  iframeId: Number(process.env.PAYMOB_IFRAME_ID || 1057319),

  // ---- Kashier ----
  kashier: {
    publicKey: process.env.KASHIER_PUBLIC_KEY,
    secretKey: process.env.KASHIER_SECRET_KEY,
    apiEndpoint: process.env.KASHIER_API_ENDPOINT || "https://api.kashier.io/api/v1"
  }
};
