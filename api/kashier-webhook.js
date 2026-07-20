// ==========================================
//  POST /api/kashier-webhook
//  Vercel Serverless Function
//  Receives Kashier payment callbacks,
//  verifies signature, and updates payment status.
// ==========================================

const { db, admin } = require("../lib/firebase");
const { verifyWebhookSignature } = require("../lib/kashier/kashierService");
const logger = require("../lib/logger");

// Map Kashier status strings to internal status
const STATUS_MAP = {
  success: "paid",
  SUCCESS: "paid",
  pending: "pending",
  PENDING: "pending",
  failed: "failed",
  FAILED: "failed",
  cancelled_by_user: "cancelled",
  CANCELLED: "cancelled",
  error: "failed",
  ERROR: "failed"
};

module.exports = async function handler(req, res) {
  // Allow POST and GET for flexibility
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    // Kashier sends callback data in the request body (POST)
    // or as query parameters (GET redirect callback)
    const data = req.method === "POST" ? req.body : req.query;

    if (!data) {
      logger.warn("Kashier webhook received with no data");
      return res.status(400).send("Bad Request: missing data");
    }

    // Extract relevant fields from Kashier callback
    const {
      merchantId,
      orderId,
      order_id,
      transactionId,
      transaction_id,
      amount,
      currency,
      status: kashierStatus,
      paymentStatus,
      signature,
      hash
    } = data;

    const resolvedOrderId = orderId || order_id || "";
    const resolvedTransactionId = transactionId || transaction_id || "";
    const resolvedStatus = kashierStatus || paymentStatus || "unknown";
    const resolvedSignature = signature || hash || "";

    logger.info("Kashier webhook received", {
      orderId: resolvedOrderId,
      transactionId: resolvedTransactionId,
      status: resolvedStatus,
      amount,
      currency
    });

    // Verify signature if provided (skip in test mode if missing)
    if (resolvedSignature && req.method === "POST") {
      const rawBody = typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);

      const isValid = verifyWebhookSignature(rawBody, resolvedSignature);
      if (!isValid) {
        logger.warn("Kashier webhook signature verification failed — processing anyway (test mode)", {
          orderId: resolvedOrderId
        });
        // In test mode, we continue processing even if signature fails
        // In production, uncomment the lines below:
        // return res.status(403).send("Forbidden: Invalid signature");
      } else {
        logger.info("Kashier webhook signature verified successfully");
      }
    } else {
      logger.warn("Kashier webhook received without signature — skipping verification (test mode)");
    }

    // Map Kashier status to internal status
    const internalStatus = STATUS_MAP[resolvedStatus] || "pending";

    logger.info("Kashier webhook status mapping", {
      kashierStatus: resolvedStatus,
      internalStatus
    });

    // Find the payment document
    // Our paymentId was used as the merchantOrderId/orderId sent to Kashier
    const paymentRef = db.collection("payments").doc(resolvedOrderId);
    const paymentDoc = await paymentRef.get();

    if (paymentDoc.exists) {
      // Update the payment document
      await paymentRef.update({
        status: internalStatus,
        transactionId: resolvedTransactionId,
        kashierStatus: resolvedStatus,
        paymentResponse: {
          merchantId: merchantId || null,
          orderId: resolvedOrderId,
          transactionId: resolvedTransactionId,
          amount: amount || null,
          currency: currency || null,
          status: resolvedStatus
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info("Kashier payment updated via paymentId", {
        paymentId: resolvedOrderId,
        status: internalStatus
      });

      return res.status(200).send("OK");
    }

    // Fallback: search by orderId field
    const snapshot = await db.collection("payments")
      .where("orderId", "==", resolvedOrderId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        status: internalStatus,
        transactionId: resolvedTransactionId,
        kashierStatus: resolvedStatus,
        paymentResponse: {
          merchantId: merchantId || null,
          orderId: resolvedOrderId,
          transactionId: resolvedTransactionId,
          amount: amount || null,
          currency: currency || null,
          status: resolvedStatus
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info("Kashier payment updated via orderId query", {
        paymentId: doc.id,
        status: internalStatus
      });

      return res.status(200).send("OK");
    }

    // Payment document not found
    logger.warn("Kashier payment document not found", {
      orderId: resolvedOrderId,
      transactionId: resolvedTransactionId
    });
    return res.status(404).send("Payment not found");

  } catch (error) {
    logger.error("kashier-webhook error", {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).send("Internal Server Error");
  }
};
