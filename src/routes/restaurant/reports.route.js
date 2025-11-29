const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { 
  reportsToday, 
  reportsMonth, 
  reportsSixMonth, 
  reportsOneYear,
  restaurantPerformance
} = require('../../controllers/Reports.Controller');

// Restaurant Reports routes 16/09/2025
router.get('/reports_today', auth, reportsToday);
router.get('/reports_month', auth, reportsMonth);
router.get('/reports_six_month', auth, reportsSixMonth);
router.get('/reports_one_year', auth, reportsOneYear);

// Restaurant Performance API
router.get('/Restaurant_Performance/:id', auth, restaurantPerformance);

module.exports = router;
