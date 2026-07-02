// ==========================================
//  Logger — Vercel Serverless
//  Replaces firebase-functions/logger with console
// ==========================================

module.exports = {
  info: (msg, data = {}) => console.log(`[INFO] ${msg}`, JSON.stringify(data)),
  warn: (msg, data = {}) => console.warn(`[WARN] ${msg}`, JSON.stringify(data)),
  error: (msg, data = {}) => console.error(`[ERROR] ${msg}`, JSON.stringify(data))
};
