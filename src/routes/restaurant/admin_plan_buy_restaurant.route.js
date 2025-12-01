const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createAdminPlanBuyRestaurant,
  updateAdminPlanBuyRestaurant,
  getAdminPlanBuyRestaurantById,
  getAllAdminPlanBuyRestaurant,
  getAdminPlanBuyRestaurantByAuth,
  deleteAdminPlanBuyRestaurant
} = require('../../controllers/Admin_Plan_buy_Restaurant.Controller');

// Create Admin Plan Buy Restaurant (with auth)
router.post('/create', auth, createAdminPlanBuyRestaurant);

// Update Admin Plan Buy Restaurant (with auth)
router.put('/update', auth, updateAdminPlanBuyRestaurant);

// Get Admin Plan Buy Restaurant by ID (with auth)
router.get('/getbyid/:id', auth, getAdminPlanBuyRestaurantById);

// Get all Admin Plan Buy Restaurants (with auth)
router.get('/getall', auth, getAllAdminPlanBuyRestaurant);

// Get Admin Plan Buy Restaurant by auth (with auth)
router.get('/getbyauth', auth, getAdminPlanBuyRestaurantByAuth);

// Delete Admin Plan Buy Restaurant (with auth)
router.delete('/delete/:id', auth, deleteAdminPlanBuyRestaurant);

module.exports = router;

