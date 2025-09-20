const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { validateCreateItemsTypes, validateUpdateItemsTypes, handleValidationErrors } = require('../../middleware/itemsTypesValidation');
const { 
  createItemsTypes, 
  updateItemsTypes, 
  getItemsTypesById, 
  getAllItemsTypes,
  getItemsTypesByAuth,
  deleteItemsTypes
} = require('../../controllers/Items_types.Controller');

// Items_types routes 29/08/2025
router.post('/create', auth, validateCreateItemsTypes, handleValidationErrors, createItemsTypes);
router.put('/update', auth, validateUpdateItemsTypes, handleValidationErrors, updateItemsTypes);
router.get('/get/:id', auth, getItemsTypesById);
router.get('/getall', getAllItemsTypes);
router.get('/getbyauth', auth, getItemsTypesByAuth);
router.delete('/delete/:id', auth, deleteItemsTypes);

module.exports = router;
