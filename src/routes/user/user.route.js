const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  softDeleteUser,
  getUserByAuth,
  logout
} = require('../../controllers/User.Controller.js');
const {
  loginUser,
  changePassword
} = require('../../controllers/Auth.Controller.js');
const {
  sendForgetPasswordOTPController,
  verifyOTPAndResetPassword,
  verifyOTP
} = require('../../controllers/OTP.Controller.js');
const {
  validateCreateUser,
  validateUpdateUser, 
  handleValidationErrors
} = require('../../middleware/userValidation.js');
const {
  validateLogin,
  validateChangePassword
} = require('../../middleware/authValidation.js');
const {
  validateSendOTP,
  validateVerifyOTP,
  validateVerifyOTPAndResetPassword
} = require('../../middleware/otpValidation.js');
const { auth } = require('../../middleware/authMiddleware.js');

// Import JSON file routes
const jsonFileRoutes = require('./jsonFile.route.js');

// Create a new user
router.post('/create', validateCreateUser, handleValidationErrors, createUser);

// Get all users with pagination and search
router.get('/getall', auth, getAllUsers);

// Get user by ID
router.get('/getbyid/:id', auth, getUserById);

// Get user by auth (current logged in user)
router.get('/getbyauth', auth, getUserByAuth);

// Update user
router.put('/update', auth, validateUpdateUser, handleValidationErrors, updateUser);

// Delete user (hard delete)
router.delete('/delete/:id', auth, deleteUser);

// Soft delete user (deactivate)
router.patch('/:id/deactivate', auth, softDeleteUser);

// Authentication routes
router.post('/login', validateLogin, handleValidationErrors, loginUser);
router.post('/logout', auth, logout);
router.put('/change-password', auth, validateChangePassword, handleValidationErrors, changePassword);

// Forget Password routes 29/08/2025
router.post('/forget-password/send-otp', validateSendOTP, handleValidationErrors, sendForgetPasswordOTPController);
router.post('/forget-password/verify-otp', validateVerifyOTP, handleValidationErrors, verifyOTP);

// JSON File routes
// router.use('/json-files', jsonFileRoutes);

module.exports = router;
