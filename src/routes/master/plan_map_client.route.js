const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createPlanMapClient,
  updatePlanMapClient,
  getPlanMapClientById,
  getAllPlanMapClients,
  getPlanMapClientByAuth
} = require('../../controllers/Plan_map_Client.Controller');

// Create plan map client (with auth)
router.post('/create', auth, createPlanMapClient);

// Update plan map client (with auth)
router.put('/update', auth, updatePlanMapClient);

// Get plan map client by ID (with auth)
router.get('/getbyid/:id', auth, getPlanMapClientById);

// Get all plan map clients (with auth)
router.get('/getall', auth, getAllPlanMapClients);

// Get plan map client by auth (with auth)
router.get('/getbyauth', auth, getPlanMapClientByAuth);

module.exports = router;
