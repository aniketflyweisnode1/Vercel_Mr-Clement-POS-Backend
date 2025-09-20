const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  validateCreatePosOrder,
  validateUpdatePosOrder,
  handleValidationErrors
} = require('../../middleware/posOrderValidation');
const {
  createPosOrder,
  updatePosOrder,
  getPosOrderById,
  getAllPosOrders,
  getPosOrdersByAuth,
  deletePosOrder
} = require('../../controllers/Pos_Point_sales_Order.Controller');

// Create POS order (with auth)
router.post('/create', auth, validateCreatePosOrder, handleValidationErrors, createPosOrder);

// Update POS order (with auth)
router.put('/update', auth, validateUpdatePosOrder, handleValidationErrors, updatePosOrder);

// Get POS order by ID (with auth)
router.get('/getbyid/:id', auth, getPosOrderById);

// Get all POS orders (with auth)
router.get('/getall', auth, getAllPosOrders);

// Get POS orders by authenticated user (with auth)
router.get('/auth/my-orders', auth, getPosOrdersByAuth);

// Delete POS order (with auth)
router.delete('/delete/:id', auth, deletePosOrder);

module.exports = router;
