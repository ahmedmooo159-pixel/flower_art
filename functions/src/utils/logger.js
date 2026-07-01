const logger = require("firebase-functions/logger");

module.exports = {
  info: (msg, data = {}) => logger.info(msg, data),
  warn: (msg, data = {}) => logger.warn(msg, data),
  error: (msg, data = {}) => logger.error(msg, data)
};
