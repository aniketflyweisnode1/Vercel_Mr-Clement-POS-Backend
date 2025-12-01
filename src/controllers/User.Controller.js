const User = require('../models/User.model');
const Responsibility = require('../models/Responsibility.model');
const Role = require('../models/Role.model');
const Language = require('../models/Language.model');
const Currency = require('../models/currency.model');
const Country = require('../models/Country.model');
const State = require('../models/State.model');
const City = require('../models/City.model');
const Permissions_type_Map_with_Employee = require('../models/Permissions_type_Map_with_Employee.model');
const SubAdmin_Permissions = require('../models/SubAdmin_Permissions.model');
const Clock = require('../models/Clock.model');
const Review = require('../models/Review.model');
const Clients = require('../models/Clients.model');
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
      currency_id,
      timezone,
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
      currency_id,
      timezone,
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

    // Check if role = 5 and create SubAdmin_Permissions
    if (Role_id === 5) {
      try {
        // Check if permissions already exist
        const existingPermissions = await SubAdmin_Permissions.findOne({ 
          User_id: savedUser.user_id 
        });

        if (!existingPermissions) {
          const subAdminPermissions = new SubAdmin_Permissions({
            User_id: savedUser.user_id,
            IsPermissons: [{ type: 'Dashboard', status: false }],
            role_id: savedUser.Role_id,
            Status: true,
            CreateBy: req.user?.user_id || savedUser.user_id
          });
          await subAdminPermissions.save();
        }
      } catch (subAdminError) {
        console.error('Error creating SubAdmin permissions:', subAdminError);
        // Continue with user creation even if SubAdmin permissions creation fails
      }
    }

    // Manually fetch related data
    const [responsibility, role, language, currency, country, state, city, createByUser] = await Promise.all([
      Responsibility.findOne({ Responsibility_id: savedUser.Responsibility_id }),
      Role.findOne({ Role_id: savedUser.Role_id }),
      Language.findOne({ Language_id: savedUser.Language_id }),
      savedUser.currency_id ? Currency.findOne({ currency_id: savedUser.currency_id }) : null,
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
    userResponse.currency_id = currency ? { currency_id: currency.currency_id, name: currency.name, icon: currency.icon } : null;
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
      currency_id,
      timezone,
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
      currency_id,
      timezone,
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

    // Check if role = 5 and create SubAdmin_Permissions
    if (Role_id === 5) {
      try {
        // Check if permissions already exist
        const existingPermissions = await SubAdmin_Permissions.findOne({ 
          User_id: savedUser.user_id 
        });

        if (!existingPermissions) {
          const subAdminPermissions = new SubAdmin_Permissions({
            User_id: savedUser.user_id,
            IsPermissons: [{ type: 'Dashboard', status: false }],
            role_id: savedUser.Role_id,
            Status: true,
            CreateBy: req.user?.user_id || savedUser.user_id
          });
          await subAdminPermissions.save();
        }
      } catch (subAdminError) {
        console.error('Error creating SubAdmin permissions:', subAdminError);
        // Continue with user creation even if SubAdmin permissions creation fails
      }
    }

    // Manually fetch related data
    const [responsibility, role, language, currency, country, state, city, createByUser] = await Promise.all([
      Responsibility.findOne({ Responsibility_id: savedUser.Responsibility_id }),
      Role.findOne({ Role_id: savedUser.Role_id }),
      Language.findOne({ Language_id: savedUser.Language_id }),
      savedUser.currency_id ? Currency.findOne({ currency_id: savedUser.currency_id }) : null,
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
    userResponse.currency_id = currency ? { currency_id: currency.currency_id, name: currency.name, icon: currency.icon } : null;
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
    const [responsibility, role, language, currency, country, state, city, createByUser, updatedByUser] = await Promise.all([
      Responsibility.findOne({ Responsibility_id: updatedUser.Responsibility_id }),
      Role.findOne({ Role_id: updatedUser.Role_id }),
      Language.findOne({ Language_id: updatedUser.Language_id }),
      updatedUser.currency_id ? Currency.findOne({ currency_id: updatedUser.currency_id }) : null,
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
    userResponse.currency_id = currency ? { currency_id: currency.currency_id, name: currency.name, icon: currency.icon } : null;
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
    const [responsibility, role, language, currency, country, state, city, createByUser, updatedByUser] = await Promise.all([
      Responsibility.findOne({ Responsibility_id: user.Responsibility_id }),
      Role.findOne({ Role_id: user.Role_id }),
      Language.findOne({ Language_id: user.Language_id }),
      user.currency_id ? Currency.findOne({ currency_id: user.currency_id }) : null,
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
    userResponse.currency_id = currency ? { currency_id: currency.currency_id, name: currency.name, icon: currency.icon } : null;
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

// Get Employees by Client ID - Categorized by Role with Details, Timing, and Performance
const getEmployeesByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;
    const parsedClientId = parseInt(clientId);

    if (!clientId || isNaN(parsedClientId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid client ID is required'
      });
    }

    // Verify client exists
    const client = await Clients.findOne({ Clients_id: parsedClientId });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get all employees for this client
    let employees = [];
    try {
      // First, try to find employees with client_id field (if it exists in User model)
      employees = await User.find({ 
        $or: [
          { client_id: parsedClientId },
          { Clients_id: parsedClientId }
        ],
        Status: true 
      }).sort({ CreateAt: -1 });
      
      // If no employees found with client_id, try finding through CreateBy relationship
      if (employees.length === 0 && client.CreateBy) {
        employees = await User.find({ 
          CreateBy: client.CreateBy,
          Status: true 
        }).sort({ CreateAt: -1 });
      }
    } catch (error) {
      // If client_id field doesn't exist, fall back to CreateBy relationship
      if (client.CreateBy) {
        employees = await User.find({ 
          CreateBy: client.CreateBy,
          Status: true 
        }).sort({ CreateAt: -1 });
      }
    }

    if (!employees || employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employees not found for this client'
      });
    }

    // Get all employee IDs for fetching clock and review data
    const employeeIds = employees.map(emp => emp.user_id);

    // Fetch clock records and reviews for all employees
    const [allClocks, allReviews] = await Promise.all([
      Clock.find({ user_id: { $in: employeeIds }, Status: true }).sort({ CreateAt: -1 }),
      Review.find({ for_Review_id: { $in: employeeIds }, Status: true }).sort({ CreateAt: -1 })
    ]);

    // Create maps for quick lookup
    const clocksByEmployee = {};
    const reviewsByEmployee = {};
    
    allClocks.forEach(clock => {
      if (!clocksByEmployee[clock.user_id]) {
        clocksByEmployee[clock.user_id] = [];
      }
      clocksByEmployee[clock.user_id].push({
        Clock_in_id: clock.Clock_in_id,
        date: clock.date,
        in_time: clock.in_time,
        out_time: clock.out_time,
        Status: clock.Status
      });
    });

    allReviews.forEach(review => {
      if (!reviewsByEmployee[review.for_Review_id]) {
        reviewsByEmployee[review.for_Review_id] = [];
      }
      reviewsByEmployee[review.for_Review_id].push({
        Review_id: review.Review_id,
        Review_Type_id: review.Review_Type_id,
        Review_type: review.Review_type,
        ReviewStarCount: review.ReviewStarCount,
        CreateAt: review.CreateAt
      });
    });

    // Populate employee data with related information, timing, and performance
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
      employeeObj.Responsibility_id = responsibility ? { 
        Responsibility_id: responsibility.Responsibility_id, 
        Responsibility_name: responsibility.Responsibility_name 
      } : null;
      employeeObj.Role_id = role ? { 
        Role_id: role.Role_id, 
        role_name: role.role_name 
      } : null;
      employeeObj.Language_id = language ? { 
        Language_id: language.Language_id, 
        Language_name: language.Language_name 
      } : null;
      employeeObj.Country_id = country ? { 
        Country_id: country.Country_id, 
        Country_name: country.Country_name, 
        code: country.code 
      } : null;
      employeeObj.State_id = state ? { 
        State_id: state.State_id, 
        state_name: state.state_name, 
        Code: state.Code 
      } : null;
      employeeObj.City_id = city ? { 
        City_id: city.City_id, 
        City_name: city.City_name, 
        Code: city.Code 
      } : null;
      employeeObj.CreateBy = createByUser ? { 
        user_id: createByUser.user_id, 
        Name: createByUser.Name, 
        email: createByUser.email 
      } : null;

      // Add timing data (clock records)
      employeeObj.timing = clocksByEmployee[employee.user_id] || [];

      // Add performance data (reviews)
      employeeObj.performance = reviewsByEmployee[employee.user_id] || [];

      // Calculate average performance rating
      const performanceRatings = reviewsByEmployee[employee.user_id] || [];
      if (performanceRatings.length > 0) {
        const totalRating = performanceRatings.reduce((sum, review) => sum + review.ReviewStarCount, 0);
        employeeObj.averagePerformanceRating = (totalRating / performanceRatings.length).toFixed(2);
      } else {
        employeeObj.averagePerformanceRating = null;
      }

      delete employeeObj.password;
      return employeeObj;
    }));

    // Group employees by Role
    const employeesByRole = {};
    employeesResponse.forEach(employee => {
      const roleId = employee.Role_id?.Role_id || 'unknown';
      if (!employeesByRole[roleId]) {
        employeesByRole[roleId] = {
          Role_id: employee.Role_id?.Role_id || null,
          role_name: employee.Role_id?.role_name || 'Unknown Role',
          employees: []
        };
      }
      employeesByRole[roleId].employees.push(employee);
    });

    // Convert to array format
    const categorizedEmployees = Object.values(employeesByRole).map(roleGroup => ({
      Role_id: roleGroup.Role_id,
      role_name: roleGroup.role_name,
      employee_count: roleGroup.employees.length,
      employees: roleGroup.employees
    }));

    res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      client: {
        Clients_id: client.Clients_id,
        Business_Name: client.Business_Name,
        Email: client.Email
      },
      total_employees: employeesResponse.length,
      categorized_by_role: categorizedEmployees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees for client',
      error: error.message
    });
  }
};

// Get Employee Details by ID with Responsibility and Work Details
const getEmployeeDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);

    if (!id || isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid employee ID is required'
      });
    }

    // Find employee
    const employee = await User.findOne({ user_id: parsedId, Status: true });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Fetch Responsibility details
    const responsibility = await Responsibility.findOne({ 
      Responsibility_id: employee.Responsibility_id 
    });

    // Fetch all clock records for this employee
    const clockRecords = await Clock.find({ 
      user_id: parsedId, 
      Status: true 
    }).sort({ date: -1 });

    // Calculate Experience from OnboardingDate
    const onboardingDate = new Date(employee.OnboardingDate);
    const currentDate = new Date();
    const experienceInMs = currentDate - onboardingDate;
    const experienceInYears = Math.floor(experienceInMs / (1000 * 60 * 60 * 24 * 365));
    const experienceInMonths = Math.floor((experienceInMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    const experience = {
      years: experienceInYears,
      months: experienceInMonths,
      total_months: Math.floor(experienceInMs / (1000 * 60 * 60 * 24 * 30)),
      display: `${experienceInYears} years ${experienceInMonths} months`
    };

    // Calculate Shift Timings (average in_time and out_time)
    let shiftTimings = {
      average_in_time: null,
      average_out_time: null,
      average_working_hours: null,
      total_working_days: 0
    };

    if (clockRecords.length > 0) {
      const validRecords = clockRecords.filter(record => record.in_time && record.out_time);
      
      if (validRecords.length > 0) {
        // Calculate average in_time and out_time
        let totalInMinutes = 0;
        let totalOutMinutes = 0;
        let totalWorkingHours = 0;

        validRecords.forEach(record => {
          const inTime = new Date(record.in_time);
          const outTime = new Date(record.out_time);
          
          // Get hours and minutes from in_time
          const inHours = inTime.getHours();
          const inMinutes = inTime.getMinutes();
          totalInMinutes += (inHours * 60) + inMinutes;

          // Get hours and minutes from out_time
          const outHours = outTime.getHours();
          const outMinutes = outTime.getMinutes();
          totalOutMinutes += (outHours * 60) + outMinutes;

          // Calculate working hours for this day
          const workingMs = outTime - inTime;
          const workingHours = workingMs / (1000 * 60 * 60);
          totalWorkingHours += workingHours;
        });

        const avgInMinutes = Math.floor(totalInMinutes / validRecords.length);
        const avgOutMinutes = Math.floor(totalOutMinutes / validRecords.length);
        
        const avgInHours = Math.floor(avgInMinutes / 60);
        const avgInMins = avgInMinutes % 60;
        const avgOutHours = Math.floor(avgOutMinutes / 60);
        const avgOutMins = avgOutMinutes % 60;

        shiftTimings.average_in_time = `${String(avgInHours).padStart(2, '0')}:${String(avgInMins).padStart(2, '0')}`;
        shiftTimings.average_out_time = `${String(avgOutHours).padStart(2, '0')}:${String(avgOutMins).padStart(2, '0')}`;
        shiftTimings.average_working_hours = (totalWorkingHours / validRecords.length).toFixed(2);
        shiftTimings.total_working_days = validRecords.length;
      }
    }

    // Calculate Leave Information
    // Standard leave policy: 20 days per year (can be customized)
    const standardLeavePerYear = 20;
    const totalLeave = Math.floor(experienceInYears * standardLeavePerYear) + 
                       Math.floor((experienceInMonths / 12) * standardLeavePerYear);
    
    // Calculate taken leave (days without clock records in current year)
    const currentYearStart = new Date(currentDate.getFullYear(), 0, 1);
    const currentYearEnd = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59);
    
    // Get all working days in current year (days with clock records)
    const workingDaysThisYear = clockRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= currentYearStart && recordDate <= currentYearEnd && record.in_time;
    }).length;

    // Calculate total days in current year so far
    const daysInYearSoFar = Math.ceil((currentDate - currentYearStart) / (1000 * 60 * 60 * 24));
    
    // Estimate taken leave (this is a simplified calculation)
    // In a real system, you'd have a dedicated leave model
    const estimatedWorkingDays = Math.floor(daysInYearSoFar * 0.7); // Assume 70% working days
    const takenLeave = Math.max(0, estimatedWorkingDays - workingDaysThisYear);
    
    // For more accurate calculation, you might want to track leave separately
    // For now, we'll use a conservative estimate
    const leaveLeft = Math.max(0, totalLeave - takenLeave);

    // Prepare Work Details
    const workDetails = {
      OnBoardingDate: employee.OnboardingDate,
      Experience: experience,
      ShiftTimings: shiftTimings,
      TotalLeave: totalLeave,
      LeaveLeft: leaveLeft,
      TakenLeave: takenLeave
    };

    // Prepare employee response
    const employeeResponse = employee.toObject();
    
    // Add Responsibility
    employeeResponse.Responsibility = responsibility ? {
      Responsibility_id: responsibility.Responsibility_id,
      Responsibility_name: responsibility.Responsibility_name
    } : null;

    // Add Work Details
    employeeResponse.WorkDetails = workDetails;

    // Remove password
    delete employeeResponse.password;

    res.status(200).json({
      success: true,
      message: 'Employee details retrieved successfully',
      data: employeeResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee details',
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
  getEmployeesByClientId,
  getEmployeeDetailsById,
  logout,
  createEmployee
};
