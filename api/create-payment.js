// ==========================================
//  POST /api/create-payment
//  Vercel Serverless Function
//  Creates a payment session (Paymob OR Kashier)
//  and returns the redirect URL.
//  ✅ FIXED VERSION - Properly saves orderId
// ==========================================

const { db, admin } = require("../lib/firebase");
const { initiatePayment: initiatePaymobPayment } = require("../lib/paymob/paymobService");
const { initiatePayment: initiateKashierPayment } = require("../lib/kashier/kashierService");
const logger = require("../lib/logger");

// ---- CORS Configuration ----
// const ALLOWED_ORIGINS = [
//   "https://ahmedmooo159-pixel.github.io",
//   "https://flower-5f122.web.app",
//   "https://flower-5f122.firebaseapp.com",
//   "http://localhost:5000",
//   "http://localhost:5500",
//   "http://127.0.0.1:5500",
//   "http://127.0.0.1:5000"
// ];

// function setCorsHeaders(req, res) {
//   const origin = req.headers.origin || "";
//   if (ALLOWED_ORIGINS.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//   }
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.setHeader("Access-Control-Max-Age", "3600");
// }

const ALLOWED_ORIGINS = [
  "https://ahmedmooo159-pixel.github.io",
  "https://flower-5f122.web.app",
  "https://flower-5f122.firebaseapp.com",
  "http://localhost:5000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5000"
];

// ✅ يسمح بأي preview/production URL تابع لمشروعك على Vercel
// (flower-art-opal.vercel.app, flower-cp0l6u7n6-ahmed-mourad.vercel.app, إلخ)
const VERCEL_PROJECT_PATTERN = /^https:\/\/flower(-[a-z0-9]+)?(-ahmed-mourad)?\.vercel\.app$/;

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "";

  const ALLOWED_ORIGINS = [
    "https://ahmedmooo159-pixel.github.io",
    "https://flower-5f122.web.app",
    "https://flower-5f122.firebaseapp.com",
    "http://localhost:5000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5000"
  ];

  const VERCEL_PROJECT_PATTERN = /^https:\/\/flower(-[a-z0-9-]+)?\.vercel\.app$/;

  const isAllowed = ALLOWED_ORIGINS.includes(origin) || VERCEL_PROJECT_PATTERN.test(origin);

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "3600");
}
module.exports = async function handler(req, res) {
  // Handle CORS preflight
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const {
      courseId,
      courseTitle,
      price,
      customerEmail,
      customerName,
      lang,
      gateway = "paymob"
    } = req.body;

    // ---- Input validation ----
    if (!price || typeof price !== "number" || price <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing 'price'."
      });
    }
    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing 'customerEmail'."
      });
    }
    if (!customerName) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing 'customerName'."
      });
    }
    if (!["paymob", "kashier"].includes(gateway)) {
      return res.status(400).json({
        success: false,
        error: "Invalid gateway. Must be 'paymob' or 'kashier'."
      });
    }

    const amountCents = Math.round(price * 100);
    const currency = "EGP";

    const nameParts = customerName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Customer";

    const customer = {
      first_name: firstName,
      last_name: lastName,
      email: customerEmail,
      phone: ""
    };

    // Create payment document
    const paymentRef = db.collection("payments").doc();
    const paymentId = paymentRef.id;

    console.log(`[CREATE-PAYMENT] Creating payment doc: ${paymentId}, gateway: ${gateway}`);

    await paymentRef.set({
      paymentId,
      courseId: courseId || null,
      courseTitle: courseTitle || null,
      amount: amountCents,
      currency,
      status: "pending",
      gateway,
      customer,
      orderId: null,
      transactionId: null,
      lang: lang || "en",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info("Payment document created", { paymentId, gateway });

    let result;
    let orderId;

    if (gateway === "kashier") {
      // ---- KASHIER FLOW ----
      console.log(`[KASHIER] Initiating payment for ${paymentId}`);
      
      result = await initiateKashierPayment({
        amountCents,
        currency,
        merchantOrderId: paymentId,
        customer
      });

      // Extract orderId from Kashier response
      orderId = result.kashierOrderId || result.orderId || paymentId;
      
      console.log(`[KASHIER] Payment initiated, orderId: ${orderId}`);

    } else {
      // ---- PAYMOB FLOW (default) ----
      console.log(`[PAYMOB] Initiating payment for ${paymentId}`);
      
      result = await initiatePaymobPayment({
        amountCents,
        currency,
        merchantOrderId: paymentId,
        customer
      });

      orderId = result.paymobOrderId || paymentId;
      
      console.log(`[PAYMOB] Payment initiated, orderId: ${orderId}`);
    }

    // ✅ CRITICAL: Save orderId to Firebase BEFORE returning
    if (orderId) {
      await paymentRef.update({
        orderId: String(orderId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`[SUCCESS] orderId saved to Firebase: ${orderId}`);
      logger.info("orderId saved to Firebase", { paymentId, orderId, gateway });
    } else {
      console.log(`[ERROR] orderId is empty!`);
      logger.error("orderId is empty after gateway response", { paymentId, gateway });
      throw new Error("Gateway did not return a valid order ID");
    }

    // Validate redirectUrl
    if (!result.redirectUrl && !result.iframeUrl) {
      console.log(`[ERROR] No redirect URL from gateway`);
      throw new Error("Payment gateway returned no redirect URL");
    }

    const redirectUrl = result.redirectUrl || result.iframeUrl;

    console.log(`[FINAL] Returning success response - paymentId: ${paymentId}, gateway: ${gateway}`);

    return res.status(200).json({
      success: true,
      paymentId,
      orderId,
      gateway,
      redirectUrl
    });

  } catch (error) {
    console.error(`[ERROR] create-payment error:`, error.message);
    logger.error("create-payment error", {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
};
