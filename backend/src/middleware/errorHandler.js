/**
 * Global Error Handler Middleware
 * Catches and formats all errors for consistent API responses
 */

const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('═══════════ ERROR ═══════════');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('═════════════════════════════');
  }

  // Default error response
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'SyntaxError' || err instanceof SyntaxError) {
    statusCode = 400;
    message = 'Invalid request format or JSON';
    code = 'INVALID_REQUEST_FORMAT';
  }

  // Handle MongoDB/MySQL duplicate key errors
  if (err.code === 'ER_DUP_ENTRY' || err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry - this record already exists';
    code = 'DUPLICATE_ENTRY';
  }

  // Handle foreign key errors
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 404;
    message = 'Referenced record not found';
    code = 'REFERENCE_NOT_FOUND';
  }

  // Handle validation errors from Joi
  if (err.isJoi || err.details) {
    statusCode = 400;
    message = err.details?.[0]?.message || 'Validation error';
    code = 'VALIDATION_ERROR';
  }

  // Handle file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum limit (5MB)';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    } else {
      message = `File upload error: ${err.message}`;
    }
    code = 'FILE_UPLOAD_ERROR';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: message,
    code: code,
    ...(process.env.NODE_ENV === 'development' && { 
      debug: {
        originalMessage: err.message,
        originalCode: err.code
      }
    })
  });
};

/**
 * 404 Handler Middleware
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    code: 'ROUTE_NOT_FOUND'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
