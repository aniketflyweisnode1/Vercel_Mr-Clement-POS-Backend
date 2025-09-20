const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { validateCreateItems, validateUpdateItems, handleValidationErrors } = require('../../middleware/itemsValidation');
const { 
  createItems, 
  updateItems, 
  getItemsById, 
  getAllItems,
  getItemsByAuth,
  deleteItems
} = require('../../controllers/Items.Controller');

// Items routes 29/08/2025
router.post('/create', auth, validateCreateItems, handleValidationErrors, createItems);
router.put('/update', auth, validateUpdateItems, handleValidationErrors, updateItems);
router.get('/get/:id', auth, getItemsById);
router.get('/getall', getAllItems);
router.get('/getbyauth', auth, getItemsByAuth);
router.delete('/delete/:id', auth, deleteItems);

module.exports = router;
