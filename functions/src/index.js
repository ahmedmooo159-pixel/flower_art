// ==========================================
//  Firebase Cloud Functions — Paymob Integration
//  Uses Firebase Functions v2 (onRequest)
// ==========================================

const { onRequest } = require("firebase-functions/v2/https");
const { db, admin } = require("./utils/firebase");
const { initiatePayment } = require("./paymob/paymobService");
const { verifyHmac } = require("./paymob/webhook");
const config = require("./utils/config");
const logger = require("./utils/logger");

// ==========================================
//  CORS helper
// ==========================================
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
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");
}

// ==========================================
//  createPaymobPayment
//  POST — Creates a Paymob payment session
//  and returns the iframe URL + token.
// ==========================================
exports.createPaymobPayment = onRequest(
  {
    region: "us-central1",
    secrets: ["PAYMOB_API_KEY"]
  },
  async (req, res) => {
    // Handle CORS preflight
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    try {
      const { amount, currency, customer, courseId, courseTitle } = req.body;

      // ---- Input validation ----
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ success: false, error: "Invalid or missing 'amount' (must be a positive number in cents)." });
      }
      if (!currency || typeof currency !== "string") {
        return res.status(400).json({ success: false, error: "Invalid or missing 'currency'." });
      }
      if (!customer || !customer.email || !customer.first_name) {
        return res.status(400).json({ success: false, error: "Invalid or missing 'customer' (requires at least email and first_name)." });
      }

      // Create a Firestore payment document first (status: pending)
      const paymentRef = db.collection("payments").doc();
      const paymentId = paymentRef.id;

      await paymentRef.set({
        paymentId,
        courseId: courseId || null,
        courseTitle: courseTitle || null,
        amount,
        currency: currency.toUpperCase(),
        status: "pending",
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name || "",
          email: customer.email,
          phone: customer.phone || ""
        },
        orderId: null,
        transactionId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info("Payment document created", { paymentId });

      // Orchestrate the Paymob flow
      const result = await initiatePayment({
        amountCents: amount,
        currency: currency.toUpperCase(),
        merchantOrderId: paymentId,
        customer
      });

      // Save the Paymob order ID back to the document
      await paymentRef.update({
        orderId: String(result.paymobOrderId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        success: true,
        paymentId,
        paymentToken: result.paymentToken,
        iframeUrl: result.iframeUrl
      });

    } catch (error) {
      logger.error("createPaymobPayment error", { message: error.message, stack: error.stack });
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error during payment creation."
      });
    }
  }
);

// ==========================================
//  paymobWebhook
//  POST — Receives Paymob transaction callbacks,
//  verifies HMAC, and updates payment status.
// ==========================================
exports.paymobWebhook = onRequest(
  {
    region: "us-central1",
    secrets: ["PAYMOB_HMAC_TOKEN"]
  },
  async (req, res) => {
    if (req.method !== "POST" && req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      // Paymob sends the callback as POST with the transaction object in req.body.obj
      // and the HMAC as a query parameter ?hmac=...
      const hmac = req.query.hmac;
      const txnObj = req.body?.obj || req.body;

      if (!txnObj || !txnObj.id) {
        logger.warn("Webhook received with missing transaction object");
        return res.status(400).send("Bad Request: missing transaction object");
      }

      // Verify HMAC signature if provided
      if (hmac) {
        const hmacSecret = config.hmacToken;
        const isValid = verifyHmac(txnObj, hmac, hmacSecret);
        if (!isValid) {
          logger.error("Webhook HMAC verification failed", { transactionId: txnObj.id });
          return res.status(403).send("Forbidden: Invalid HMAC signature");
        }
      } else {
        logger.warn("Webhook received without HMAC — skipping verification (test mode)");
      }

      // Extract relevant fields
      const transactionId = String(txnObj.id);
      const paymobOrderId = String(txnObj.order?.id || "");
      const success = txnObj.success === true || txnObj.success === "true";
      const pending = txnObj.pending === true || txnObj.pending === "true";
      const errorOccurred = txnObj.error_occured === true || txnObj.error_occured === "true";
      const amountCents = txnObj.amount_cents;

      // Determine status
      let status = "failed";
      if (success && !pending && !errorOccurred) {
        status = "paid";
      } else if (pending) {
        status = "pending";
      } else if (txnObj.is_voided) {
        status = "cancelled";
      }

      logger.info("Webhook processing", { transactionId, paymobOrderId, status, success, pending });

      // Find the payment document by querying orderId
      const snapshot = await db.collection("payments")
        .where("orderId", "==", paymobOrderId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Fallback: try to find by paymentId (merchantOrderId)
        // Paymob's order.merchant_order_id corresponds to our paymentId
        const merchantOrderId = txnObj.order?.merchant_order_id;
        if (merchantOrderId) {
          const docRef = db.collection("payments").doc(merchantOrderId);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            await docRef.update({
              status,
              transactionId,
              orderId: paymobOrderId,
              paymentResponse: {
                success,
                pending,
                error_occured: errorOccurred,
                amount_cents: amountCents
              },
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            logger.info("Payment updated via merchantOrderId", { merchantOrderId, status });
            return res.status(200).send("OK");
          }
        }

        logger.warn("Payment document not found for webhook", { paymobOrderId, transactionId });
        return res.status(404).send("Payment not found");
      }

      // Update the first matching document
      const paymentDoc = snapshot.docs[0];
      await paymentDoc.ref.update({
        status,
        transactionId,
        paymentResponse: {
          success,
          pending,
          error_occured: errorOccurred,
          amount_cents: amountCents
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info("Payment updated via orderId", { paymentId: paymentDoc.id, status });
      return res.status(200).send("OK");

    } catch (error) {
      logger.error("paymobWebhook error", { message: error.message, stack: error.stack });
      return res.status(500).send("Internal Server Error");
    }
  }
);
