const { sendError } = require('../utils/apiResponse');

/**
 * Global Express error handler.
 * Must be registered LAST — after all routes.
 * Normalises Mongoose and JWT errors into clean JSON responses.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);

  // ── Mongoose Validation Error ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, 'Validation failed', 422, errors);
  }

  // ── Mongoose Duplicate Key (unique constraint) ─────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `Duplicate value for '${field}'. Please use a different value.`, 409);
  }

  // ── Mongoose CastError (bad ObjectId format) ───────────────────────────────
  if (err.name === 'CastError') {
    return sendError(res, `Invalid value for '${err.path}': ${err.value}`, 400);
  }

  // ── JWT Errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token has expired', 401);
  }

  // ── Express-validator errors forwarded via next(err) ──────────────────────
  if (err.type === 'validation') {
    return sendError(res, err.message, 422, err.errors || null);
  }

  // ── Generic / Unhandled Errors ─────────────────────────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  return sendError(res, message, statusCode);
}

module.exports = errorHandler;
