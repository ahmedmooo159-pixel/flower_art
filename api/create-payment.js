// ==========================================
//  POST /api/create-payment
//  Vercel Serverless Function
//  Creates a payment session (Paymob OR Kashier)
//  and returns the redirect URL.
// ==========================================

const { db, admin } = require("../lib/firebase");
const { initiatePayment: initiatePaymobPayment } = require("../lib/paymob/paymobService");
const { initiatePayment: initiateKashierPayment } = require("../lib/kashier/kashierService");
const logger = require("../lib/logger");

// ---- CORS Configuration ----
const ALLOWED_ORIGINS = [
  "https://ahmedmooo159-pixel.github.io",
  "https://flower-5f122.web.app",
  "https://flower-5f122.firebaseapp.com",
  "http://localhost:5000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5000"
];

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
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
      gateway = "paymob" // Default to paymob if not specified
    } = req.body;

    // ---- Input validation ----
    if (!price || typeof price !== "number" || price <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing 'price' (must be a positive number)."
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

    // Convert price (EGP) to amount in cents
    const amountCents = Math.round(price * 100);
    const currency = "EGP";

    // Parse customer name into first/last
    const nameParts = customerName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Customer";

    const customer = {
      first_name: firstName,
      last_name: lastName,
      email: customerEmail,
      phone: ""
    };

    // Create a Firestore payment document (status: pending)
    const paymentRef = db.collection("payments").doc();
    const paymentId = paymentRef.id;

    await paymentRef.set({
      paymentId,
      courseId: courseId || null,
      courseTitle: courseTitle || null,
      amount: amountCents,
      currency,
      status: "pending",
      gateway, // Track which gateway is being used
      customer,
      orderId: null,
      transactionId: null,
      lang: lang || "en",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info("Payment document created", { paymentId, gateway });

    let result;

    if (gateway === "kashier") {
      // ---- KASHIER FLOW ----
      result = await initiateKashierPayment({
        amountCents,
        currency,
        merchantOrderId: paymentId,
        customer
      });

      // Save Kashier order ID
      await paymentRef.update({
        orderId: String(result.kashierOrderId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } else {
      // ---- PAYMOB FLOW (default) ----
      result = await initiatePaymobPayment({
        amountCents,
        currency,
        merchantOrderId: paymentId,
        customer
      });

      // Save Paymob order ID
      await paymentRef.update({
        orderId: String(result.paymobOrderId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Return redirectUrl (the iframe/redirect URL)
    // Paymob returns iframeUrl, Kashier returns redirectUrl
    return res.status(200).json({
      success: true,
      paymentId,
      gateway,
      redirectUrl: result.redirectUrl || result.iframeUrl
    });

  } catch (error) {
    logger.error("create-payment error", {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during payment creation."
    });
  }
};