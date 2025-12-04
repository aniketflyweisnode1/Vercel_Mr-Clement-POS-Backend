const { body, validationResult } = require('express-validator');

const validateCreateItems = [
  body('Items_types_id')
    .notEmpty()
    .withMessage('Items type ID is required')
    .isNumeric()
    .withMessage('Invalid Items type ID'),
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
  body('item-name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Item name must be between 2 and 100 characters'),
  body('item-code')
    .trim()
    .notEmpty()
    .withMessage('Item code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Item code must be between 2 and 20 characters'),
  body('item-size')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Item size must not exceed 50 characters'),
  body('item-price')
    .notEmpty()
    .withMessage('Item price is required')
    .isFloat({ min: 0 })
    .withMessage('Item price must be a positive number'),
  body('item-quantity')
    .notEmpty()
    .withMessage('Item quantity is required')
    .isInt({ min: 0 })
    .withMessage('Item quantity must be a non-negative integer'),
  body('item-stock-quantity')
    .notEmpty()
    .withMessage('Item stock quantity is required')
    .isInt({ min: 0 })
    .withMessage('Item stock quantity must be a non-negative integer'),
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

const validateUpdateItems = [
  body('id')
    .notEmpty()
    .withMessage('Item ID is required')
    .isNumeric()
    .withMessage('Invalid Item ID'),
  body('Items_types_id')
    .optional()
    .notEmpty()
    .withMessage('Items type ID cannot be empty')
    .isNumeric()
    .withMessage('Invalid Items type ID'),
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
  body('item-name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Item name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Item name must be between 2 and 100 characters'),
  body('item-code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Item code cannot be empty')
    .isLength({ min: 2, max: 20 })
    .withMessage('Item code must be between 2 and 20 characters'),
  body('item-size')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Item size must not exceed 50 characters'),
  body('item-price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Item price must be a positive number'),
  body('item-quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Item quantity must be a non-negative integer'),
  body('item-stock-quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Item stock quantity must be a non-negative integer'),
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
  validateCreateItems,
  validateUpdateItems,
  handleValidationErrors
};
