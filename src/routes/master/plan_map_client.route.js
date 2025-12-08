const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createPlanMapClient,
  updatePlanMapClient,
  getPlanMapClientById,
  getAllPlanMapClients,
  getPlanMapClientByAuth,
  getSubscriptionsList
} = require('../../controllers/Plan_map_Client.Controller');

// Create plan map client (with auth)
router.post('/create-Subscriptions', auth, createPlanMapClient);

// Update plan map client (with auth)
router.put('/update-Subscriptions', auth, updatePlanMapClient);

// Get plan map client by ID (with auth)
router.get('/getbyid-Subscriptions/:id', auth, getPlanMapClientById);

// Get all plan map clients (with auth)
router.get('/getall-Subscriptions', auth, getAllPlanMapClients);

// Get plan map client by auth (with auth)
router.get('/getbyauth', auth, getPlanMapClientByAuth);

// Get subscriptions list with date filter (with auth)
router.get('/getSubscriptionsList', auth, getSubscriptionsList);



module.exports = router;
