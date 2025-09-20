const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createCurrency,
  updateCurrency,
  getCurrencyById,
  getAllCurrencies,
  getCurrencyByAuth
} = require('../../controllers/currency.Controller');

// Create currency (with auth)
router.post('/create', auth, createCurrency);

// Update currency (with auth)
router.put('/update', auth, updateCurrency);

// Get currency by ID (with auth)
router.get('/getbyid/:id', auth, getCurrencyById);

// Get all currencies (with auth)
router.get('/getall', auth, getAllCurrencies);

// Get currency by auth (with auth)
router.get('/getbyauth', auth, getCurrencyByAuth);

module.exports = router;
