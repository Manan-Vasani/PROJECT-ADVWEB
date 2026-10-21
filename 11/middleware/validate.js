/**
 * Server-Side Input Validation Middleware for Practical 7
 * Enforces strict input validation before reaching database/controllers
 */

// Simple email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate User Registration input
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(' '),
      details: errors
    });
  }

  // Sanitize
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validate User Login input
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join(' '),
      details: errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validate Task Creation / Update input
 */
export const validateTask = (req, res, next) => {
  const { title, priority } = req.body || {};

  // For POST requests, title is strictly required
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Task title is required and cannot be empty.',
        details: ['title is required']
      });
    }
  }

  // If title is passed in PUT/PATCH, validate length
  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Task title cannot be empty.',
      details: ['title cannot be empty']
    });
  }

  // Validate priority enum if provided
  if (priority !== undefined) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid priority "${priority}". Allowed values: low, medium, high.`,
        details: ['priority must be low, medium, or high']
      });
    }
  }

  next();
};
