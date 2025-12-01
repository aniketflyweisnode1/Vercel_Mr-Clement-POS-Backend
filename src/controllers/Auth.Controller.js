const User = require('../models/User.model');
const Responsibility = require('../models/Responsibility.model');
const Role = require('../models/Role.model');
const Language = require('../models/Language.model');
const Country = require('../models/Country.model');
const State = require('../models/State.model');
const City = require('../models/City.model');
const { generateToken } = require('../middleware/authMiddleware');

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.Status || !user.isLoginPermission) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Manually fetch related data
    const [responsibility, role, language, country, state, city, createByUser, updatedByUser] = await Promise.all([
      Responsibility.findOne({ Responsibility_id: user.Responsibility_id }),
      Role.findOne({ Role_id: user.Role_id }),
      Language.findOne({ Language_id: user.Language_id }),
      Country.findOne({ Country_id: user.Country_id }),
      State.findOne({ State_id: user.State_id }),
      City.findOne({ City_id: user.City_id }),
      user.CreateBy ? User.findOne({ user_id: user.CreateBy }) : null,
      user.UpdatedBy ? User.findOne({ user_id: user.UpdatedBy }) : null
    ]);

    // Create response object with populated data
    const userResponse = user.toObject();
    userResponse.Responsibility_id = responsibility ? { Responsibility_id: responsibility.Responsibility_id, Responsibility_name: responsibility.Responsibility_name } : null;
    userResponse.Role_id = role ? { Role_id: role.Role_id, role_name: role.role_name } : null;
    userResponse.Language_id = language ? { Language_id: language.Language_id, Language_name: language.Language_name } : null;
    userResponse.Country_id = country ? { Country_id: country.Country_id, Country_name: country.Country_name, code: country.code } : null;
    userResponse.State_id = state ? { State_id: state.State_id, state_name: state.state_name, Code: state.Code } : null;
    userResponse.City_id = city ? { City_id: city.City_id, City_name: city.City_name, Code: city.Code } : null;
    userResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    userResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

    // Remove password from response
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponse
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token. However, we can implement a blacklist if needed.
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};

// Forgot Password - Send reset email




// Change Password (for authenticated users)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const currentPassword = oldPassword; // Support both oldPassword and currentPassword
    const userId = req.user.user_id;

    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash the new password (same method as in User model pre-save hook)
    const timestamp = Date.now().toString();
    const simpleHash = newPassword + timestamp;
    const hashedPassword = timestamp + ':' + simpleHash;

    // Update password using updateOne to avoid full document validation
    await User.updateOne(
      { user_id: userId },
      { 
        password: hashedPassword,
        UpdatedBy: userId,
        UpdatedAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// Login with OTP generation






module.exports = {
  loginUser,
  logoutUser,
  changePassword
};
