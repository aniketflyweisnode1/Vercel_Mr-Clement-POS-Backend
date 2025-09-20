const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { validateCreateItemMapVariants, validateUpdateItemMapVariants, handleValidationErrors } = require('../../middleware/itemMapVariantsValidation');
const { 
  createItemMapVariants, 
  updateItemMapVariants, 
  getItemMapVariantsById, 
  getAllItemMapVariants,
  getItemMapVariantsByAuth,
  deleteItemMapVariants
} = require('../../controllers/item_map_Variants.Controller');

// Item map variants routes
router.post('/create', auth, validateCreateItemMapVariants, handleValidationErrors, createItemMapVariants);
router.put('/update', auth, validateUpdateItemMapVariants, handleValidationErrors, updateItemMapVariants);
router.get('/get/:id', auth, getItemMapVariantsById);
router.get('/getall', getAllItemMapVariants);
router.get('/getbyauth', auth, getItemMapVariantsByAuth);
router.delete('/delete/:id', auth, deleteItemMapVariants);

module.exports = router;
