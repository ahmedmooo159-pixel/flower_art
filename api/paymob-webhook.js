// ==========================================
//  POST /api/paymob-webhook
//  Vercel Serverless Function
//  Receives Paymob transaction callbacks,
//  verifies HMAC, and updates payment status.
// ==========================================

const { db, admin } = require("../lib/firebase");
const { verifyHmac } = require("../lib/paymob/webhook");
const config = require("../lib/config");
const logger = require("../lib/logger");

module.exports = async function handler(req, res) {
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
    logger.error("paymob-webhook error", { message: error.message, stack: error.stack });
    return res.status(500).send("Internal Server Error");
  }
};
