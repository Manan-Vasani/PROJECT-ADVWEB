import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware for Practical 7
 * Verifies JWT token from Authorization header (Bearer <token>)
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access denied. No authentication token provided in Authorization header.'
    });
  }

  const secret = process.env.JWT_SECRET || 'charusat_itue301_practical7_jwt_secret_key_2026';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { id: user._id, email: user.email, name: user.name }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or malformed authentication token.'
    });
  }
};
