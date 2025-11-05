const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createFloorMapTable,
  updateFloorMapTable,
  getFloorMapTableById,
  getAllFloorMapTables,
  getTableByFloorId,
  deleteFloorMapTable
} = require('../../controllers/Floor_map_Table.Controller');

// Create floor map table (with auth)
router.post('/create', auth, createFloorMapTable);

// Update floor map table (with auth)
router.put('/update', auth, updateFloorMapTable);

// Get floor map table by ID (with auth)
router.get('/getbyid/:id', auth, getFloorMapTableById);

// Get all floor map tables
router.get('/getall', getAllFloorMapTables);

// Get tables by floor ID (with auth)
router.get('/getTablebyFloorid/:floor_id', auth, getTableByFloorId);

// Delete floor map table (with auth)
router.delete('/delete/:id', auth, deleteFloorMapTable);

module.exports = router;

