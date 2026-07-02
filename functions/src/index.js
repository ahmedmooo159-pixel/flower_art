// ==========================================
//  Firebase Cloud Functions — Paymob Integration
//  Uses Firebase Functions v2 (onCall + onRequest)
// ==========================================

const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, admin } = require("./utils/firebase");
const { initiatePayment } = require("./paymob/paymobService");
const { verifyHmac } = require("./paymob/webhook");
const config = require("./utils/config");
const logger = require("./utils/logger");

// ==========================================
//  CORS helper (for webhook only)
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
//  onCall — Creates a Paymob payment session
//  and returns the iframe URL as redirectUrl.
// ==========================================
exports.createPaymobPayment = onCall(
  {
    region: "us-central1",
    secrets: ["PAYMOB_API_KEY"]
  },
  async (request) => {
    try {
      const data = request.data;
      const { courseId, courseTitle, price, customerEmail, customerName, lang } = data;

      // ---- Input validation ----
      if (!price || typeof price !== "number" || price <= 0) {
        throw new HttpsError("invalid-argument", "Invalid or missing 'price' (must be a positive number).");
      }
      if (!customerEmail) {
        throw new HttpsError("invalid-argument", "Invalid or missing 'customerEmail'.");
      }
      if (!customerName) {
        throw new HttpsError("invalid-argument", "Invalid or missing 'customerName'.");
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

      // Return redirectUrl (the iframe URL) to match client expectations
      return {
        success: true,
        paymentId,
        redirectUrl: result.iframeUrl
      };

    } catch (error) {
      // Re-throw HttpsError as-is
      if (error instanceof HttpsError) {
        throw error;
      }
      logger.error("createPaymobPayment error", { message: error.message, stack: error.stack });
      throw new HttpsError("internal", error.message || "Internal server error during payment creation.");
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
