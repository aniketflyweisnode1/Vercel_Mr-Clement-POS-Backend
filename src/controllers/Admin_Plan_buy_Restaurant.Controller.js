const Admin_Plan_buy_Restaurant = require('../models/Admin_Plan_buy_Restaurant.model');
const Admin_Plan = require('../models/Admin_Plan.model');
const User = require('../models/User.model');

// Create Admin Plan Buy Restaurant
const createAdminPlanBuyRestaurant = async (req, res) => {
  try {
    const { Admin_Plan_id, isActive, paymentStatus, Trangection_id, expiry_date } = req.body;
    const userId = req.user.user_id;

    if (!Admin_Plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Admin_Plan_id is required'
      });
    }

    // Verify Admin Plan exists
    const adminPlan = await Admin_Plan.findOne({ Admin_Plan_id: parseInt(Admin_Plan_id) });
    if (!adminPlan) {
      return res.status(404).json({
        success: false,
        message: 'Admin Plan not found'
      });
    }

    const adminPlanBuyRestaurant = new Admin_Plan_buy_Restaurant({
      Admin_Plan_id: parseInt(Admin_Plan_id),
      isActive: isActive !== undefined ? isActive : true,
      paymentStatus: paymentStatus !== undefined ? paymentStatus : false,
      Trangection_id: Trangection_id ? parseInt(Trangection_id) : null,
      expiry_date: expiry_date ? new Date(expiry_date) : null,
      Status: true,
      CreateBy: userId
    });

    const savedPlanBuy = await adminPlanBuyRestaurant.save();

    // Fetch related data
    const [createByUser, updatedByUser, adminPlanData] = await Promise.all([
      User.findOne({ user_id: savedPlanBuy.CreateBy }),
      savedPlanBuy.UpdatedBy ? User.findOne({ user_id: savedPlanBuy.UpdatedBy }) : null,
      Admin_Plan.findOne({ Admin_Plan_id: savedPlanBuy.Admin_Plan_id })
    ]);

    const planBuyResponse = savedPlanBuy.toObject();
    planBuyResponse.CreateBy = createByUser ? {
      user_id: createByUser.user_id,
      Name: createByUser.Name,
      email: createByUser.email
    } : null;
    planBuyResponse.UpdatedBy = updatedByUser ? {
      user_id: updatedByUser.user_id,
      Name: updatedByUser.Name,
      email: updatedByUser.email
    } : null;
    planBuyResponse.Admin_Plan_id = adminPlanData ? {
      Admin_Plan_id: adminPlanData.Admin_Plan_id,
      PlanName: adminPlanData.PlanName,
      Description: adminPlanData.Description,
      Price: adminPlanData.Price
    } : null;

    res.status(201).json({
      success: true,
      message: 'Admin plan buy restaurant created successfully',
      data: planBuyResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating admin plan buy restaurant',
      error: error.message
    });
  }
};

// Update Admin Plan Buy Restaurant
const updateAdminPlanBuyRestaurant = async (req, res) => {
  try {
    const { id, Admin_Plan_id, isActive, paymentStatus, Trangection_id, expiry_date, Status } = req.body;
    const userId = req.user.user_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Admin Plan Buy Restaurant ID is required in request body'
      });
    }

    const adminPlanBuyRestaurant = await Admin_Plan_buy_Restaurant.findOne({ 
      Admin_Plan_buy_Restaurant_id: parseInt(id) 
    });

    if (!adminPlanBuyRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Admin plan buy restaurant not found'
      });
    }

    // Verify Admin Plan exists if updating
    if (Admin_Plan_id !== undefined) {
      const adminPlan = await Admin_Plan.findOne({ Admin_Plan_id: parseInt(Admin_Plan_id) });
      if (!adminPlan) {
        return res.status(404).json({
          success: false,
          message: 'Admin Plan not found'
        });
      }
      adminPlanBuyRestaurant.Admin_Plan_id = parseInt(Admin_Plan_id);
    }

    if (isActive !== undefined) adminPlanBuyRestaurant.isActive = isActive;
    if (paymentStatus !== undefined) adminPlanBuyRestaurant.paymentStatus = paymentStatus;
    if (Trangection_id !== undefined) {
      adminPlanBuyRestaurant.Trangection_id = Trangection_id ? parseInt(Trangection_id) : null;
    }
    if (expiry_date !== undefined) {
      adminPlanBuyRestaurant.expiry_date = expiry_date ? new Date(expiry_date) : null;
    }
    if (Status !== undefined) adminPlanBuyRestaurant.Status = Status;
    
    adminPlanBuyRestaurant.UpdatedBy = userId;
    adminPlanBuyRestaurant.UpdatedAt = new Date();

    const updatedPlanBuy = await adminPlanBuyRestaurant.save();

    // Fetch related data
    const [createByUser, updatedByUser, adminPlanData] = await Promise.all([
      User.findOne({ user_id: updatedPlanBuy.CreateBy }),
      User.findOne({ user_id: updatedPlanBuy.UpdatedBy }),
      Admin_Plan.findOne({ Admin_Plan_id: updatedPlanBuy.Admin_Plan_id })
    ]);

    const planBuyResponse = updatedPlanBuy.toObject();
    planBuyResponse.CreateBy = createByUser ? {
      user_id: createByUser.user_id,
      Name: createByUser.Name,
      email: createByUser.email
    } : null;
    planBuyResponse.UpdatedBy = updatedByUser ? {
      user_id: updatedByUser.user_id,
      Name: updatedByUser.Name,
      email: updatedByUser.email
    } : null;
    planBuyResponse.Admin_Plan_id = adminPlanData ? {
      Admin_Plan_id: adminPlanData.Admin_Plan_id,
      PlanName: adminPlanData.PlanName,
      Description: adminPlanData.Description,
      Price: adminPlanData.Price
    } : null;

    res.status(200).json({
      success: true,
      message: 'Admin plan buy restaurant updated successfully',
      data: planBuyResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating admin plan buy restaurant',
      error: error.message
    });
  }
};

// Get Admin Plan Buy Restaurant by ID
const getAdminPlanBuyRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    const adminPlanBuyRestaurant = await Admin_Plan_buy_Restaurant.findOne({ 
      Admin_Plan_buy_Restaurant_id: parseInt(id) 
    });

    if (!adminPlanBuyRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Admin plan buy restaurant not found'
      });
    }

    // Fetch related data
    const [createByUser, updatedByUser, adminPlanData] = await Promise.all([
      User.findOne({ user_id: adminPlanBuyRestaurant.CreateBy }),
      adminPlanBuyRestaurant.UpdatedBy ? User.findOne({ user_id: adminPlanBuyRestaurant.UpdatedBy }) : null,
      Admin_Plan.findOne({ Admin_Plan_id: adminPlanBuyRestaurant.Admin_Plan_id })
    ]);

    const planBuyResponse = adminPlanBuyRestaurant.toObject();
    planBuyResponse.CreateBy = createByUser ? {
      user_id: createByUser.user_id,
      Name: createByUser.Name,
      email: createByUser.email
    } : null;
    planBuyResponse.UpdatedBy = updatedByUser ? {
      user_id: updatedByUser.user_id,
      Name: updatedByUser.Name,
      email: updatedByUser.email
    } : null;
    planBuyResponse.Admin_Plan_id = adminPlanData ? {
      Admin_Plan_id: adminPlanData.Admin_Plan_id,
      PlanName: adminPlanData.PlanName,
      Description: adminPlanData.Description,
      Price: adminPlanData.Price
    } : null;

    res.status(200).json({
      success: true,
      data: planBuyResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin plan buy restaurant',
      error: error.message
    });
  }
};

// Get All Admin Plan Buy Restaurant
const getAllAdminPlanBuyRestaurant = async (req, res) => {
  try {
    const adminPlanBuyRestaurants = await Admin_Plan_buy_Restaurant.find({ Status: true })
      .sort({ CreateAt: -1 });

    // Fetch related data for all records
    const plansBuyWithPopulatedData = await Promise.all(
      adminPlanBuyRestaurants.map(async (planBuy) => {
        const [createByUser, updatedByUser, adminPlanData] = await Promise.all([
          User.findOne({ user_id: planBuy.CreateBy }),
          planBuy.UpdatedBy ? User.findOne({ user_id: planBuy.UpdatedBy }) : null,
          Admin_Plan.findOne({ Admin_Plan_id: planBuy.Admin_Plan_id })
        ]);

        const planBuyResponse = planBuy.toObject();
        planBuyResponse.CreateBy = createByUser ? {
          user_id: createByUser.user_id,
          Name: createByUser.Name,
          email: createByUser.email
        } : null;
        planBuyResponse.UpdatedBy = updatedByUser ? {
          user_id: updatedByUser.user_id,
          Name: updatedByUser.Name,
          email: updatedByUser.email
        } : null;
        planBuyResponse.Admin_Plan_id = adminPlanData ? {
          Admin_Plan_id: adminPlanData.Admin_Plan_id,
          PlanName: adminPlanData.PlanName,
          Description: adminPlanData.Description,
          Price: adminPlanData.Price
        } : null;

        return planBuyResponse;
      })
    );

    res.status(200).json({
      success: true,
      count: plansBuyWithPopulatedData.length,
      data: plansBuyWithPopulatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin plan buy restaurants',
      error: error.message
    });
  }
};

// Get Admin Plan Buy Restaurant by Auth (current logged in user)
const getAdminPlanBuyRestaurantByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Find plans bought by the current user
    const adminPlanBuyRestaurants = await Admin_Plan_buy_Restaurant.find({ 
      CreateBy: userId,
      Status: true 
    }).sort({ CreateAt: -1 });

    if (adminPlanBuyRestaurants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No admin plan buy restaurants found for current user'
      });
    }

    // Fetch related data for all records
    const plansBuyWithPopulatedData = await Promise.all(
      adminPlanBuyRestaurants.map(async (planBuy) => {
        const [createByUser, updatedByUser, adminPlanData] = await Promise.all([
          User.findOne({ user_id: planBuy.CreateBy }),
          planBuy.UpdatedBy ? User.findOne({ user_id: planBuy.UpdatedBy }) : null,
          Admin_Plan.findOne({ Admin_Plan_id: planBuy.Admin_Plan_id })
        ]);

        const planBuyResponse = planBuy.toObject();
        planBuyResponse.CreateBy = createByUser ? {
          user_id: createByUser.user_id,
          Name: createByUser.Name,
          email: createByUser.email
        } : null;
        planBuyResponse.UpdatedBy = updatedByUser ? {
          user_id: updatedByUser.user_id,
          Name: updatedByUser.Name,
          email: updatedByUser.email
        } : null;
        planBuyResponse.Admin_Plan_id = adminPlanData ? {
          Admin_Plan_id: adminPlanData.Admin_Plan_id,
          PlanName: adminPlanData.PlanName,
          Description: adminPlanData.Description,
          Price: adminPlanData.Price
        } : null;

        return planBuyResponse;
      })
    );

    res.status(200).json({
      success: true,
      count: plansBuyWithPopulatedData.length,
      data: plansBuyWithPopulatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin plan buy restaurants',
      error: error.message
    });
  }
};

// Delete Admin Plan Buy Restaurant
const deleteAdminPlanBuyRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const adminPlanBuyRestaurant = await Admin_Plan_buy_Restaurant.findOne({ 
      Admin_Plan_buy_Restaurant_id: parseInt(id) 
    });

    if (!adminPlanBuyRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Admin plan buy restaurant not found'
      });
    }

    await Admin_Plan_buy_Restaurant.deleteOne({ Admin_Plan_buy_Restaurant_id: parseInt(id) });

    res.status(200).json({
      success: true,
      message: 'Admin plan buy restaurant deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting admin plan buy restaurant',
      error: error.message
    });
  }
};

module.exports = {
  createAdminPlanBuyRestaurant,
  updateAdminPlanBuyRestaurant,
  getAdminPlanBuyRestaurantById,
  getAllAdminPlanBuyRestaurant,
  getAdminPlanBuyRestaurantByAuth,
  deleteAdminPlanBuyRestaurant
};

