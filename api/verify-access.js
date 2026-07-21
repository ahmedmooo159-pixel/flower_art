// ==========================================
//  POST /api/verify-access
//  Vercel Serverless Function
//  Verifies the student's access code for a course
// ==========================================

const { db } = require("../lib/firebase-admin");

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

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || VERCEL_PROJECT_PATTERN.test(origin);

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "3600");
}

// In-memory rate limiting (per Vercel instance)
const failedAttempts = new Map(); // key: IP, value: { count, resetTime }

function cleanupLimits() {
  const now = Date.now();
  for (const [ip, data] of failedAttempts.entries()) {
    if (now > data.resetTime) {
      failedAttempts.delete(ip);
    }
  }
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  // Basic rate limiting
  cleanupLimits();
  const limit = failedAttempts.get(ip);
  if (limit && limit.count >= 10 && now < limit.resetTime) {
    return res.status(429).json({
      success: false,
      error: "Too many failed attempts. Please try again in 1 minute."
    });
  }

  try {
    const { courseId, accessCode } = req.body;

    if (!courseId || !accessCode) {
      return res.status(400).json({ success: false, error: "Missing course ID or access code" });
    }

    // Query enrollments for active code matching courseId (case-insensitive search isn't native, so we do it in firestore if exact, or lowercase them)
    // To support case-insensitive, we lowercase the code before querying, or load and check.
    // Let's query by courseId and then verify the accessCode case-insensitively.
    const enrollmentsSnap = await db.collection("enrollments")
      .where("courseId", "==", String(courseId))
      .where("active", "==", true)
      .get();

    let enrollmentDoc = null;
    const lowerCode = accessCode.trim().toLowerCase();

    for (const doc of enrollmentsSnap.docs) {
      const data = doc.data();
      if (data.accessCode && data.accessCode.trim().toLowerCase() === lowerCode) {
        enrollmentDoc = data;
        break;
      }
    }

    if (!enrollmentDoc) {
      // Record failed attempt
      const currentLimit = failedAttempts.get(ip) || { count: 0, resetTime: now + 60000 };
      currentLimit.count++;
      failedAttempts.set(ip, currentLimit);

      return res.status(403).json({ success: false, error: "Invalid access code" });
    }

    // Fetch lessons from the course document
    const courseDoc = await db.collection("courses").doc(String(courseId)).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    const courseData = courseDoc.data();
    const lessons = courseData.lessons || [];

    // Success response
    return res.status(200).json({
      success: true,
      lessons
    });

  } catch (error) {
    console.error("[VERIFY-ACCESS] Error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
