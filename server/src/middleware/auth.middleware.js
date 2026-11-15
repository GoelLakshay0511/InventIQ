const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

/**
 * Auth middleware — verifies JWT access token from Authorization header.
 * Attaches decoded payload ({ id, phone }) to req.user on success.
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access token missing or malformed', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = decoded; // { id, phone, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Access token expired', 401);
    }
    return sendError(res, 'Invalid access token', 401);
  }
}

module.exports = { authMiddleware };
