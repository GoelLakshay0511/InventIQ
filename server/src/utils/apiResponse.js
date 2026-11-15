/**
 * Utility helpers for sending consistent JSON API responses.
 * All API responses follow the shape: { success, message, data?, errors? }
 */

/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {*} data - Payload to include under the `data` key
 * @param {string} message - Human-readable success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 400)
 * @param {Array|null} errors - Optional array of field-level validation errors
 */
function sendError(res, message = 'Something went wrong', statusCode = 400, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };
