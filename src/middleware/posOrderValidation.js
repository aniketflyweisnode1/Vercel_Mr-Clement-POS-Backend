const { body, validationResult } = require('express-validator');

// Validation rules for creating POS order
const validateCreatePosOrder = [
  body('items')
    .notEmpty()
    .withMessage('Items array is required')
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least one item'),
  body('items.*.item_id')
    .notEmpty()
    .withMessage('Item ID is required for each item')
    .isNumeric()
    .withMessage('Item ID must be a number'),
  body('items.*.item_Quentry')
    .notEmpty()
    .withMessage('Item quantity is required for each item')
    .isNumeric()
    .withMessage('Item quantity must be a number')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be at least 1'),
  body('items.*.item_Addons_id')
    .optional()
    .isNumeric()
    .withMessage('Item addon ID must be a number'),
  body('items.*.item_Variants_id')
    .optional()
    .isNumeric()
    .withMessage('Item variant ID must be a number'),
  body('Tax')
    .notEmpty()
    .withMessage('Tax is required')
    .isNumeric()
    .withMessage('Tax must be a number')
    .isFloat({ min: 0 })
    .withMessage('Tax must be a non-negative number'),
  body('Customer_id')
    .optional()
    .isNumeric()
    .withMessage('Customer ID must be a number'),
  body('Dining_Option')
    .optional()
    .isIn(['Dine in', 'Delivery', 'Take Away'])
    .withMessage('Dining option must be one of: Dine in, Delivery, Take Away'),
  body('Table_id')
    .optional()
    .isNumeric()
    .withMessage('Table ID must be a number'),
  body('Kitchen_id')
    .optional()
    .isNumeric()
    .withMessage('Kitchen ID must be a number'),
  body('Status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean value')
];

// Validation rules for updating POS order
const validateUpdatePosOrder = [
  body('id')
    .notEmpty()
    .withMessage('POS order ID is required')
    .isNumeric()
    .withMessage('POS order ID must be a number'),
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least one item'),
  body('items.*.item_id')
    .optional()
    .isNumeric()
    .withMessage('Item ID must be a number'),
  body('items.*.item_Quentry')
    .optional()
    .isNumeric()
    .withMessage('Item quantity must be a number')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be at least 1'),
  body('items.*.item_Addons_id')
    .optional()
    .isNumeric()
    .withMessage('Item addon ID must be a number'),
  body('items.*.item_Variants_id')
    .optional()
    .isNumeric()
    .withMessage('Item variant ID must be a number'),
  body('Tax')
    .optional()
    .isNumeric()
    .withMessage('Tax must be a number')
    .isFloat({ min: 0 })
    .withMessage('Tax must be a non-negative number'),
  body('Customer_id')
    .optional()
    .isNumeric()
    .withMessage('Customer ID must be a number'),
  body('Dining_Option')
    .optional()
    .isIn(['Dine in', 'Delivery', 'Take Away'])
    .withMessage('Dining option must be one of: Dine in, Delivery, Take Away'),
  body('Table_id')
    .optional()
    .isNumeric()
    .withMessage('Table ID must be a number'),
  body('Kitchen_id')
    .optional()
    .isNumeric()
    .withMessage('Kitchen ID must be a number'),
  body('Status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean value')
];

// Handle validation errors
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
  validateCreatePosOrder,
  validateUpdatePosOrder,
  handleValidationErrors
};
