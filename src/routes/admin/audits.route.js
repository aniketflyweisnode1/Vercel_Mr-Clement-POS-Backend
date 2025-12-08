const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createAudit,
  updateAudit,
  getAuditById,
  getAllAudits,
  getAuditLogs,
  getAuditByAuth
} = require('../../controllers/Audits.Controller');

// Create audit (with auth)
router.post('/create', auth, createAudit);

// Update audit (with auth)
router.put('/update', auth, updateAudit);

// Get audit by ID (with auth)
router.get('/getbyid/:id', auth, getAuditById);

// Get all audits (with auth)
router.get('/getall', auth, getAllAudits);

// Get audit by auth (with auth)
router.get('/getbyauth', auth, getAuditByAuth);

// Get audit logs (with auth)
router.get('/getAuditLogs', auth, getAuditLogs);

module.exports = router;
