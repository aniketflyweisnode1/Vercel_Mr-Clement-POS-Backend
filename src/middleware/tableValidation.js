const { body, validationResult } = require('express-validator');

const validateCreateTable = [
  body('Table_types_id')
    .notEmpty()
    .withMessage('Table type ID is required')
    .isNumeric()
    .withMessage('Invalid Table type ID'),
  body('Emozi')
    .trim()
    .notEmpty()
    .withMessage('Emoji is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji must be between 1 and 10 characters'),
  body('image')
    .optional()
    .trim()
    .isString()
    .withMessage('Image must be a string'),
  body('Table-name')
    .trim()
    .notEmpty()
    .withMessage('Table name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Table name must be between 2 and 100 characters'),
  body('Table-code')
    .trim()
    .notEmpty()
    .withMessage('Table code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Table code must be between 2 and 20 characters'),
  body('Table-booking-price')
    .notEmpty()
    .withMessage('Table booking price is required')
    .isFloat({ min: 0 })
    .withMessage('Table booking price must be a positive number'),
  body('Table-Booking-Status_id')
    .notEmpty()
    .withMessage('Table booking status ID is required')
    .isNumeric()
    .withMessage('Invalid Table booking status ID'),
  body('Seating-Persons_Count')
    .notEmpty()
    .withMessage('Seating persons count is required')
    .isInt({ min: 0 })
    .withMessage('Seating persons count must be a non-negative integer'),
  body('Details')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Details must not exceed 500 characters'),
  body('Status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean value')
];

const validateUpdateTable = [
  body('id')
    .notEmpty()
    .withMessage('Table ID is required')
    .isNumeric()
    .withMessage('Invalid Table ID'),
  body('Table_types_id')
    .optional()
    .notEmpty()
    .withMessage('Table type ID cannot be empty')
    .isNumeric()
    .withMessage('Invalid Table type ID'),
  body('Emozi')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Emoji cannot be empty')
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji must be between 1 and 10 characters'),
  body('image')
    .optional()
    .trim()
    .isString()
    .withMessage('Image must be a string'),
  body('Table-name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Table name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Table name must be between 2 and 100 characters'),
  body('Table-code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Table code cannot be empty')
    .isLength({ min: 2, max: 20 })
    .withMessage('Table code must be between 2 and 20 characters'),
  body('Table-booking-price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Table booking price must be a positive number'),
  body('Table-Booking-Status_id')
    .optional()
    .notEmpty()
    .withMessage('Table booking status ID cannot be empty')
    .isNumeric()
    .withMessage('Invalid Table booking status ID'),
  body('Seating-Persons_Count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Seating persons count must be a non-negative integer'),
  body('Details')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Details must not exceed 500 characters'),
  body('Status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean value')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateCreateTable,
  validateUpdateTable,
  handleValidationErrors
};
