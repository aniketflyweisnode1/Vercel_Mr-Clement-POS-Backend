const User = require('../models/User.model');
const Responsibility = require('../models/Responsibility.model');
const Role = require('../models/Role.model');
const Language = require('../models/Language.model');
const Country = require('../models/Country.model');
const State = require('../models/State.model');
const City = require('../models/City.model');
const Permissions_type_Map_with_Employee = require('../models/Permissions_type_Map_with_Employee.model');
const { generateEmployeeId } = require('../utils/employeeIdGenerator');

// Create User
const createUser = async (req, res) => {
  try {
    const {
      Name,
      last_name,
      Responsibility_id,
      Role_id,
      Language_id,
      Country_id,
      State_id,
      password,
      City_id,
      email,
      phone,
      Permissions_type_id,
      gender,
      user_image,
      OnboardingDate,
      yearsWithus,
      isLoginPermission,
      Status
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email?.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
        error: `A user with email "${email}" already exists`
      });
    }

    // Generate unique employee ID
    const Employee_id = await generateEmployeeId();

    const user = new User({
      Name,
      last_name,
      Responsibility_id,
      Role_id,
      Language_id,
      Country_id,
      State_id,
      City_id,
      Employee_id,
      email,
      phone,
      password,
      gender,
      user_image,
      OnboardingDate,
      yearsWithus,
      isLoginPermission,
      Permissions_type_id,
      Status,
      CreateBy: req.user?.user_id || null
    });

    const savedUser = await user.save();

    // Check if role = 2 and create Permissions_type_Map_with_Employee
    if (Role_id === 2) {
      try {
        const permissionsTypeMap = new Permissions_type_Map_with_Employee({
          Permissions_type_id: Permissions_type_id, // Default permission type ID, you can modify this as needed
          user_id: savedUser.user_id,
          Status: true,
          CreateBy: req.user?.user_id || savedUser.user_id
        });
        await permissionsTypeMap.save();
      } catch (permissionError) {
        console.error('Error creating permissions type map:', permissionError);
        // Continue with user creation even if permission mapping fails
      }
    }

    // Manually fetch related data
    const [responsibility, role, language, country, state, city, createByUser] = await Promise.all([
      Responsibility.findOne({ Responsibility_id: savedUser.Responsibility_id }),
      Role.findOne({ Role_id: savedUser.Role_id }),
      Language.findOne({ Language_id: savedUser.Language_id }),
      Country.findOne({ Country_id: savedUser.Country_id }),
      State.findOne({ State_id: savedUser.State_id }),
      City.findOne({ City_id: savedUser.City_id }),
      savedUser.CreateBy ? User.findOne({ user_id: savedUser.CreateBy }) : null
    ]);

    // Create response object with populated data
    const userResponse = savedUser.toObject();
    userResponse.Responsibility_id = responsibility ? { Responsibility_id: responsibility.Responsibility_id, Responsibility_name: responsibility.Responsibility_name } : null;
    userResponse.Role_id = role ? { Role_id: role.Role_id, role_name: role.role_name } : null;
    userResponse.Language_id = language ? { Language_id: language.Language_id, Language_name: language.Language_name } : null;
    userResponse.Country_id = country ? { Country_id: country.Country_id, Country_name: country.Country_name, code: country.code } : null;
    userResponse.State_id = state ? { State_id: state.State_id, state_name: state.state_name, Code: state.Code } : null;
    userResponse.City_id = city ? { City_id: city.City_id, City_name: city.City_name, Code: city.Code } : null;
    userResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;

    // Remove password from response
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    // Handle duplicate key error (email or Employee_id)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      let message = `${field} already exists`;

      if (field === 'email') {
        message = `Email "${value}" is already registered`;
      } else if (field === 'Employee_id') {
        message = `Employee ID "${value}" already exists`;
      }

      return res.status(400).json({
        success: false,
        message: message,
        error: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

const createEmployee = async (req, res) => {
  try {
    const {
      Name,
      last_name,
      Responsibility_id,
      Role_id,
      Language_id,
      Country_id,
      State_id,
      password,
      City_id,
      email,
      phone,
      Permissions_type_id,
      gender,
      user_image,
      OnboardingDate,
      yearsWithus,
      isLoginPermission,
      Status
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email?.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
        error: `A user with email "${email}" already exists`
      });
    }

    // Generate unique employee ID
    const Employee_id = await generateEmployeeId();

    const user = new User({
      Name,
      last_name,
      Responsibility_id,
      Role_id,
      Language_id,
      Country_id,
      State_id,
      City_id,
      Employee_id,
      email,
      phone,
      password,
      gender,
      user_image,
      OnboardingDate,
      yearsWithus,
      isLoginPermission,
      Permissions_type_id,
      Status,
      CreateBy: req.user?.user_id || null
    });

    const savedUser = await user.save();

    // Check if role = 2 and create Permissions_type_Map_with_Employee
    if (Role_id === 2) {
      try {
        const permissionsTypeMap = new Permissions_type_Map_with_Employee({
          Permissions_type_id: Permissions_type_id, // Default permission type ID, you can modify this as needed
          user_id: savedUser.user_id,
          Status: true,
          CreateBy: req.user?.user_id || savedUser.user_id
        });
        await permissionsTypeMap.save();
      } catch (permissionError) {
        console.error('Error creating permissions type map:', permissionError);
        // Continue with user creation even if permission mapping fails
      }
    }

    // Manually fetch related data
    const [responsibility, role, language, country, state, city, createByUser] = await Promise.all([
      Responsibility.findOne({ Responsibility_id: savedUser.Responsibility_id }),
      Role.findOne({ Role_id: savedUser.Role_id }),
      Language.findOne({ Language_id: savedUser.Language_id }),
      Country.findOne({ Country_id: savedUser.Country_id }),
      State.findOne({ State_id: savedUser.State_id }),
      City.findOne({ City_id: savedUser.City_id }),
      savedUser.CreateBy ? User.findOne({ user_id: savedUser.CreateBy }) : null
    ]);

    // Create response object with populated data
    const userResponse = savedUser.toObject();
    userResponse.Responsibility_id = responsibility ? { Responsibility_id: responsibility.Responsibility_id, Responsibility_name: responsibility.Responsibility_name } : null;
    userResponse.Role_id = role ? { Role_id: role.Role_id, role_name: role.role_name } : null;
    userResponse.Language_id = language ? { Language_id: language.Language_id, Language_name: language.Language_name } : null;
    userResponse.Country_id = country ? { Country_id: country.Country_id, Country_name: country.Country_name, code: country.code } : null;
    userResponse.State_id = state ? { State_id: state.State_id, state_name: state.state_name, Code: state.Code } : null;
    userResponse.City_id = city ? { City_id: city.City_id, City_name: city.City_name, Code: city.Code } : null;
    userResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;

    // Remove password from response
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    // Handle duplicate key error (email or Employee_id)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      let message = `${field} already exists`;

      if (field === 'email') {
        message = `Email "${value}" is already registered`;
      } else if (field === 'Employee_id') {
        message = `Employee ID "${value}" already exists`;
      }

      return res.status(400).json({
        success: false,
        message: message,
        error: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};
// Update User
const updateUser = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const userId = req.user.user_id;

    // Remove empty password strings (they will be handled by validation, but this is a safety check)
    if (updateData.password === '' || updateData.password === null) {
      delete updateData.password;
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required in request body'
      });
    }

    const user = await User.findOne({ user_id: parseInt(id) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being updated and if it already exists (excluding current user)
    if (updateData.email) {
      const emailToCheck = updateData.email.toLowerCase().trim();
      const existingUserWithEmail = await User.findOne({
        email: emailToCheck,
        user_id: { $ne: parseInt(id) } // Exclude current user
      });

      if (existingUserWithEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
          error: `A user with email "${updateData.email}" already exists`
        });
      }
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'password' && key !== 'Employee_id' && key !== 'user_id') {
        user[key] = updateData[key];
      }
    });

    // Check if role is being updated to 2 and create Permissions_type_Map_with_Employee if it doesn't exist
    if (updateData.Role_id === 2) {
      try {
        const existingPermissionMap = await Permissions_type_Map_with_Employee.findOne({
          user_id: user.user_id,
          Status: true
        });

        if (!existingPermissionMap) {
          const permissionsTypeMap = new Permissions_type_Map_with_Employee({
            Permissions_type_id: 1, // Default permission type ID, you can modify this as needed
            user_id: user.user_id,
            Status: true,
            CreateBy: userId
          });
          await permissionsTypeMap.save();
        }
      } catch (permissionError) {
        console.error('Error creating permissions type map:', permissionError);
        // Continue with user update even if permission mapping fails
      }
    }

    // Handle password update separately
    if (updateData.password) {
      user.password = updateData.password;
    }

    user.UpdatedBy = userId;
    user.UpdatedAt = new Date();

    const updatedUser = await user.save();

    // Manually fetch related data
    const [responsibility, role, language, country, state, city, createByUser, updatedByUser] = await Promise.all([
      Responsibility.findOne({ Responsibility_id: updatedUser.Responsibility_id }),
      Role.findOne({ Role_id: updatedUser.Role_id }),
      Language.findOne({ Language_id: updatedUser.Language_id }),
      Country.findOne({ Country_id: updatedUser.Country_id }),
      State.findOne({ State_id: updatedUser.State_id }),
      City.findOne({ City_id: updatedUser.City_id }),
      updatedUser.CreateBy ? User.findOne({ user_id: updatedUser.CreateBy }) : null,
      updatedUser.UpdatedBy ? User.findOne({ user_id: updatedUser.UpdatedBy }) : null
    ]);

    // Create response object with populated data
    const userResponse = updatedUser.toObject();
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
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (error) {
    // Handle duplicate key error (email or Employee_id)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      let message = `${field} already exists`;

      if (field === 'email') {
        message = `Email "${value}" is already registered`;
      } else if (field === 'Employee_id') {
        message = `Employee ID "${value}" already exists`;
      }

      return res.status(400).json({
        success: false,
        message: message,
        error: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Get User by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ user_id: parseInt(id) });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ Status: true }).sort({ CreateAt: -1 });

    // Manually fetch related data for all users
    const usersResponse = await Promise.all(users.map(async (user) => {
      const [responsibility, role, language, country, state, city, createByUser] = await Promise.all([
        Responsibility.findOne({ Responsibility_id: user.Responsibility_id }),
        Role.findOne({ Role_id: user.Role_id }),
        Language.findOne({ Language_id: user.Language_id }),
        Country.findOne({ Country_id: user.Country_id }),
        State.findOne({ State_id: user.State_id }),
        City.findOne({ City_id: user.City_id }),
        user.CreateBy ? User.findOne({ user_id: user.CreateBy }) : null
      ]);

      const userObj = user.toObject();
      userObj.Responsibility_id = responsibility ? { Responsibility_id: responsibility.Responsibility_id, Responsibility_name: responsibility.Responsibility_name } : null;
      userObj.Role_id = role ? { Role_id: role.Role_id, role_name: role.role_name } : null;
      userObj.Language_id = language ? { Language_id: language.Language_id, Language_name: language.Language_name } : null;
      userObj.Country_id = country ? { Country_id: country.Country_id, Country_name: country.Country_name, code: country.code } : null;
      userObj.State_id = state ? { State_id: state.State_id, state_name: state.state_name, Code: state.Code } : null;
      userObj.City_id = city ? { City_id: city.City_id, City_name: city.City_name, Code: city.Code } : null;
      userObj.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;

      delete userObj.password;
      return userObj;
    }));

    res.status(200).json({
      success: true,
      count: usersResponse.length,
      data: usersResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get User by Auth (current logged in user)
const getUserByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findOne({ user_id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};



// Delete User (hard delete)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const user = await User.findOne({ user_id: parseInt(id) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findOneAndDelete({ user_id: parseInt(id) });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Soft Delete User (deactivate)
const softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const user = await User.findOne({ user_id: parseInt(id) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.Status = false;
    user.isLoginPermission = false;
    user.UpdatedBy = userId;
    user.UpdatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deactivating user',
      error: error.message
    });
  }
};

// Get employees by restaurant (created_by) ID
const getEmployeesByRestaurantId = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { Responsibility } = req.query;
    const parsedRestaurantId = parseInt(restaurantId);

    if (!restaurantId || isNaN(parsedRestaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid restaurant ID is required'
      });
    }

    const restaurantUser = await User.findOne({ user_id: parsedRestaurantId });
    if (!restaurantUser) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant user not found'
      });
    }

    const restaurantRole = await Role.findOne({ Role_id: restaurantUser.Role_id });
    if (!restaurantRole || restaurantRole.role_name?.toLowerCase() !== 'restaurant') {
      return res.status(400).json({
        success: false,
        message: 'Provided user is not associated with a restaurant role'
      });
    }

    const filter = { CreateBy: parsedRestaurantId, Status: true };
    if (Responsibility !== undefined && Responsibility !== '') {
      const parsedResponsibility = parseInt(Responsibility);
      if (isNaN(parsedResponsibility)) {
        return res.status(400).json({
          success: false,
          message: 'Responsibility must be a valid numeric ID'
        });
      }
      filter.Responsibility_id = parsedResponsibility;
    }

    const employees = await User.find(filter).sort({ CreateAt: -1 });

    if (!employees || employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employees not found for this restaurant'
      });
    }

    const employeesResponse = await Promise.all(employees.map(async (employee) => {
      const [responsibility, role, language, country, state, city, createByUser] = await Promise.all([
        Responsibility.findOne({ Responsibility_id: employee.Responsibility_id }),
        Role.findOne({ Role_id: employee.Role_id }),
        Language.findOne({ Language_id: employee.Language_id }),
        Country.findOne({ Country_id: employee.Country_id }),
        State.findOne({ State_id: employee.State_id }),
        City.findOne({ City_id: employee.City_id }),
        employee.CreateBy ? User.findOne({ user_id: employee.CreateBy }) : null
      ]);

      const employeeObj = employee.toObject();
      employeeObj.Responsibility_id = responsibility ? { Responsibility_id: responsibility.Responsibility_id, Responsibility_name: responsibility.Responsibility_name } : null;
      employeeObj.Role_id = role ? { Role_id: role.Role_id, role_name: role.role_name } : null;
      employeeObj.Language_id = language ? { Language_id: language.Language_id, Language_name: language.Language_name } : null;
      employeeObj.Country_id = country ? { Country_id: country.Country_id, Country_name: country.Country_name, code: country.code } : null;
      employeeObj.State_id = state ? { State_id: state.State_id, state_name: state.state_name, Code: state.Code } : null;
      employeeObj.City_id = city ? { City_id: city.City_id, City_name: city.City_name, Code: city.Code } : null;
      employeeObj.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;

      delete employeeObj.password;
      return employeeObj;
    }));

    res.status(200).json({
      success: true,
      count: employeesResponse.length,
      data: employeesResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees for restaurant',
      error: error.message
    });
  }
};

// Logout User
const logout = async (req, res) => {
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



module.exports = {
  createUser,
  updateUser,
  getUserById,
  getAllUsers,
  getUserByAuth,
  deleteUser,
  softDeleteUser,
  getEmployeesByRestaurantId,
  logout,
  createEmployee
};
