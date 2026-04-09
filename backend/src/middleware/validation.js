/**
 * Input Validation Middleware
 * Validates request data using Joi
 */

const Joi = require('joi');

/**
 * Validate Registration Data
 */
const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().regex(/^[0-9]{10}$/).required(),
    email: Joi.string().email().optional(),
    address: Joi.string().max(255).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

/**
 * Validate OTP Verification
 */
const validateOtpVerify = (req, res, next) => {
  const schema = Joi.object({
    phone: Joi.string().regex(/^[0-9]{10}$/).required(),
    otp: Joi.string().length(6).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

/**
 * Validate Forgot Password - Request OTP
 */
const validateForgotPasswordRequest = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

/**
 * Validate Forgot Password - Verify OTP
 */
const validateForgotPasswordVerify = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

/**
 * Validate Forgot Password - Reset
 */
const validateForgotPasswordReset = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

/**
 * Validate Complaint Submission
 */
const createComplaintSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  category: Joi.string().valid('pothole', 'streetlight', 'water', 'electricity', 'cleanliness', 'drainage', 'garbage', 'other').required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  address: Joi.string().max(255).optional(),
  district: Joi.string().max(100).optional().allow('', null),
  taluk: Joi.string().max(100).optional().allow('', null)
});

const validateComplaintSubmission = (req, res, next) => {
  const { error } = createComplaintSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

/**
 * Validate Status Update
 */
const validateStatusUpdate = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid('Pending', 'Verified', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Rejected').required(),
    notes: Joi.string().max(1000).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateOtpVerify,
  validateForgotPasswordRequest,
  validateForgotPasswordVerify,
  validateForgotPasswordReset,
  validateComplaintSubmission,
  validateStatusUpdate
};
