const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createAdminPlan,
  updateAdminPlan,
  getAdminPlanById,
  getAllAdminPlans,
  getAdminPlanByAuth,
  deleteAdminPlan
} = require('../../controllers/Admin_Plan.Controller');

// Create Admin Plan (with auth)
router.post('/create', auth, createAdminPlan);

// Update Admin Plan (with auth)
router.put('/update', auth, updateAdminPlan);

// Get Admin Plan by ID (with auth)
router.get('/getbyid/:id', auth, getAdminPlanById);

// Get all Admin Plans (with auth)
router.get('/getall', auth, getAllAdminPlans);

// Get Admin Plan by auth (with auth)
router.get('/getbyauth', auth, getAdminPlanByAuth);

// Delete Admin Plan (with auth)
router.delete('/delete/:id', auth, deleteAdminPlan);

module.exports = router;

