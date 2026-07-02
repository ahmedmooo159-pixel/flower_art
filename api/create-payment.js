// ==========================================
//  POST /api/create-payment
//  Vercel Serverless Function
//  Creates a Paymob payment session and
//  returns the iframe redirect URL.
// ==========================================

const { db, admin } = require("../lib/firebase");
const { initiatePayment } = require("../lib/paymob/paymobService");
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
    const { courseId, courseTitle, price, customerEmail, customerName, lang } = req.body;

    // ---- Input validation ----
    if (!price || typeof price !== "number" || price <= 0) {
      return res.status(400).json({ success: false, error: "Invalid or missing 'price' (must be a positive number)." });
    }
    if (!customerEmail) {
      return res.status(400).json({ success: false, error: "Invalid or missing 'customerEmail'." });
    }
    if (!customerName) {
      return res.status(400).json({ success: false, error: "Invalid or missing 'customerName'." });
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

    // Create a Firestore payment document first (status: pending)
    const paymentRef = db.collection("payments").doc();
    const paymentId = paymentRef.id;

    await paymentRef.set({
      paymentId,
      courseId: courseId || null,
      courseTitle: courseTitle || null,
      amount: amountCents,
      currency,
      status: "pending",
      customer,
      orderId: null,
      transactionId: null,
      lang: lang || "en",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info("Payment document created", { paymentId });

    // Orchestrate the Paymob flow
    const result = await initiatePayment({
      amountCents,
      currency,
      merchantOrderId: paymentId,
      customer
    });

    // Save the Paymob order ID back to the document
    await paymentRef.update({
      orderId: String(result.paymobOrderId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return redirectUrl (the iframe URL)
    return res.status(200).json({
      success: true,
      paymentId,
      redirectUrl: result.iframeUrl
    });

  } catch (error) {
    logger.error("create-payment error", { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during payment creation."
    });
  }
};
