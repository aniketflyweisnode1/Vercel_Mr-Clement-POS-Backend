const MyDevices = require('../models/MyDevices.model');
const User = require('../models/User.model');

// Create MyDevices
const createMyDevices = async (req, res) => {
  try {
    const { Name, type, Status } = req.body;
    const userId = req.user.user_id;

    const myDevices = new MyDevices({
      Name,
      type,
      Status,
      CreateBy: userId
    });

    const savedMyDevices = await myDevices.save();
    
    res.status(201).json({
      success: true,
      message: 'MyDevices created successfully',
      data: savedMyDevices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating MyDevices',
      error: error.message
    });
  }
};

// Update MyDevices
const updateMyDevices = async (req, res) => {
  try {
    const { id, Name, type, Status } = req.body;
    const userId = req.user.user_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'MyDevices ID is required in request body'
      });
    }

    const myDevices = await MyDevices.findOne({ MyDevices_id: parseInt(id) });
    if (!myDevices) {
      return res.status(404).json({
        success: false,
        message: 'MyDevices not found'
      });
    }

    if (Name !== undefined) myDevices.Name = Name;
    if (type !== undefined) myDevices.type = type;
    if (Status !== undefined) myDevices.Status = Status;
    
    myDevices.UpdatedBy = userId;
    myDevices.UpdatedAt = new Date();

    const updatedMyDevices = await myDevices.save();
    
    res.status(200).json({
      success: true,
      message: 'MyDevices updated successfully',
      data: updatedMyDevices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating MyDevices',
      error: error.message
    });
  }
};

// Get MyDevices by ID
const getMyDevicesById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const myDevices = await MyDevices.findOne({ MyDevices_id: parseInt(id) });
    
    if (!myDevices) {
      return res.status(404).json({
        success: false,
        message: 'MyDevices not found'
      });
    }

    // Manually fetch related data
    const [createByUser, updatedByUser] = await Promise.all([
      myDevices.CreateBy ? User.findOne({ user_id: myDevices.CreateBy }) : null,
      myDevices.UpdatedBy ? User.findOne({ user_id: myDevices.UpdatedBy }) : null
    ]);

    // Create response object with populated data
    const myDevicesResponse = myDevices.toObject();
    myDevicesResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    myDevicesResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

    res.status(200).json({
      success: true,
      data: myDevicesResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching MyDevices',
      error: error.message
    });
  }
};

// Get all MyDevices
const getAllMyDevices = async (req, res) => {
  try {
    const myDevices = await MyDevices.find()
      .sort({ CreateAt: -1 });

    // Manually fetch related data for all MyDevices
    const myDevicesWithPopulatedData = await Promise.all(
      myDevices.map(async (device) => {
        const [createByUser, updatedByUser] = await Promise.all([
          device.CreateBy ? User.findOne({ user_id: device.CreateBy }) : null,
          device.UpdatedBy ? User.findOne({ user_id: device.UpdatedBy }) : null
        ]);

        const deviceResponse = device.toObject();
        deviceResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
        deviceResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

        return deviceResponse;
      })
    );

    res.status(200).json({
      success: true,
      count: myDevicesWithPopulatedData.length,
      data: myDevicesWithPopulatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching MyDevices',
      error: error.message
    });
  }
};

// Get MyDevices by authenticated user
const getMyDevicesByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const myDevices = await MyDevices.find({ CreateBy: userId })
      .sort({ CreateAt: -1 });

    // Manually fetch related data for user's MyDevices
    const myDevicesWithPopulatedData = await Promise.all(
      myDevices.map(async (device) => {
        const [createByUser, updatedByUser] = await Promise.all([
          device.CreateBy ? User.findOne({ user_id: device.CreateBy }) : null,
          device.UpdatedBy ? User.findOne({ user_id: device.UpdatedBy }) : null
        ]);

        const deviceResponse = device.toObject();
        deviceResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
        deviceResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

        return deviceResponse;
      })
    );

    res.status(200).json({
      success: true,
      count: myDevicesWithPopulatedData.length,
      data: myDevicesWithPopulatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user MyDevices',
      error: error.message
    });
  }
};

// Delete MyDevices
const deleteMyDevices = async (req, res) => {
  try {
    const { id } = req.params;
    
    const myDevices = await MyDevices.findOne({ MyDevices_id: parseInt(id) });
    
    if (!myDevices) {
      return res.status(404).json({
        success: false,
        message: 'MyDevices not found'
      });
    }

    await MyDevices.deleteOne({ MyDevices_id: parseInt(id) });
    
    res.status(200).json({
      success: true,
      message: 'MyDevices deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting MyDevices',
      error: error.message
    });
  }
};

module.exports = {
  createMyDevices,
  updateMyDevices,
  getMyDevicesById,
  getAllMyDevices,
  getMyDevicesByAuth,
  deleteMyDevices
};
