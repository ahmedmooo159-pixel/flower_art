module.exports = {
  // Stored securely in Firebase Secrets Manager
  apiKey: process.env.PAYMOB_API_KEY || "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRFNU1EazJNQ3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5rU0RodzROd1lUbVdJOS1iZ3ZIZnRXRmtGRnhpNHFwOGNMSjBnNzFqZHNHUDl5MktHa0REMmhnTTlubFNGRzVWTUdGOEFmX1dRWlVEcXRtOHNzNmV0dw==",
  hmacToken: process.env.PAYMOB_HMAC_TOKEN || "E54BBAF7AEABA1411EE8A2A5CEA56CDC",
  publicKey: process.env.PAYMOB_PUBLIC_KEY || "egy_pk_test_bsgLBJovVUdGJ14mQdtJYL4b2L3tXIGB",
  secretKey: process.env.PAYMOB_SECRET_KEY || "egy_sk_test_ed1818be34d1e7423e72f4f1190e765a95fd47c1a46562c7b73d05745351d879",

  // Configurable integration parameters
  integrationId: Number(process.env.PAYMOB_INTEGRATION_ID || 5765248), // VPC Card integration ID
  iframeId: Number(process.env.PAYMOB_IFRAME_ID || 1057319) // Card iframe template ID
};
