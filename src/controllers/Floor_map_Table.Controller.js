const Floor_map_Table = require('../models/Floor_map_Table.model');
const User = require('../models/User.model');
const Floor = require('../models/Floor.model');
const Floor_Type = require('../models/Floor_Type.model');
const Table = require('../models/Table.model');
const Table_types = require('../models/Table_types.model');
const Table_Booking_Status = require('../models/Table-Booking-Status.model');

// Create Floor Map Table
const createFloorMapTable = async (req, res) => {
  try {
    const {
      floor_id,
      table_id,
      Row_No,
      Status
    } = req.body;

    const floorMapTable = new Floor_map_Table({
      floor_id,
      table_id,
      Row_No: Row_No !== undefined ? Row_No : null,
      Status: Status !== undefined ? Status : true,
      CreateBy: req.user?.user_id || null
    });

    const savedFloorMapTable = await floorMapTable.save();
    
    // Manually fetch related data
    const [createByUser, updatedByUser, floorData, tableData] = await Promise.all([
      savedFloorMapTable.CreateBy ? User.findOne({ user_id: savedFloorMapTable.CreateBy }) : null,
      savedFloorMapTable.UpdatedBy ? User.findOne({ user_id: savedFloorMapTable.UpdatedBy }) : null,
      savedFloorMapTable.floor_id ? Floor.findOne({ Floor_id: savedFloorMapTable.floor_id }) : null,
      savedFloorMapTable.table_id ? Table.findOne({ Table_id: savedFloorMapTable.table_id }) : null
    ]);

    // Fetch nested data for floor (Floor_Type) and table (Table_types and Table-Booking-Status)
    const [floorTypeData, tableTypeData, tableBookingStatusData] = await Promise.all([
      floorData && floorData.Floor_Type_id ? Floor_Type.findOne({ Floor_Type_id: floorData.Floor_Type_id }) : null,
      tableData && tableData.Table_types_id ? Table_types.findOne({ Table_types_id: tableData.Table_types_id }) : null,
      tableData && tableData['Table-Booking-Status_id'] ? Table_Booking_Status.findOne({ 'Table-Booking-Status_id': tableData['Table-Booking-Status_id'] }) : null
    ]);

    // Create response object with populated data
    const floorMapTableResponse = savedFloorMapTable.toObject();
    
    // Ensure Row_No is included in response
    floorMapTableResponse.Row_No = savedFloorMapTable.Row_No !== undefined ? savedFloorMapTable.Row_No : null;
    
    // Populate CreateBy and UpdatedBy with full user data
    floorMapTableResponse.CreateBy = createByUser ? 
      { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    floorMapTableResponse.UpdatedBy = updatedByUser ? 
      { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
    
    // Populate floor_id with full floor data including nested Floor_Type
    if (floorData) {
      const floorObj = floorData.toObject();
      floorObj.Floor_Type_id = floorTypeData ? 
        { Floor_Type_id: floorTypeData.Floor_Type_id, Floor_Type_Name: floorTypeData.Floor_Type_Name, emozi: floorTypeData.emozi } : null;
      floorMapTableResponse.floor_id = floorObj;
    } else {
      floorMapTableResponse.floor_id = null;
    }
    
    // Populate table_id with full table data including nested Table_types and Table-Booking-Status
    if (tableData) {
      const tableObj = tableData.toObject();
      tableObj.Table_types_id = tableTypeData ? 
        { Table_types_id: tableTypeData.Table_types_id, Name: tableTypeData.Name, emozi: tableTypeData.emozi } : null;
      tableObj['Table-Booking-Status_id'] = tableBookingStatusData ? 
        { 'Table-Booking-Status_id': tableBookingStatusData['Table-Booking-Status_id'], Name: tableBookingStatusData.Name } : null;
      floorMapTableResponse.table_id = tableObj;
    } else {
      floorMapTableResponse.table_id = null;
    }
    
    res.status(201).json({
      success: true,
      message: 'Floor map table created successfully',
      data: floorMapTableResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating floor map table',
      error: error.message
    });
  }
};

// Update Floor Map Table
const updateFloorMapTable = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const userId = req.user.user_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Floor Map Table ID is required in request body'
      });
    }

    const floorMapTable = await Floor_map_Table.findOne({ floor_map_Table_id: parseInt(id) });
    if (!floorMapTable) {
      return res.status(404).json({
        success: false,
        message: 'Floor map table not found'
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'floor_map_Table_id') {
        floorMapTable[key] = updateData[key];
      }
    });

    floorMapTable.UpdatedBy = userId;
    floorMapTable.UpdatedAt = new Date();

    const updatedFloorMapTable = await floorMapTable.save();
    
    // Manually fetch related data
    const [createByUser, updatedByUser, floorData, tableData] = await Promise.all([
      updatedFloorMapTable.CreateBy ? User.findOne({ user_id: updatedFloorMapTable.CreateBy }) : null,
      updatedFloorMapTable.UpdatedBy ? User.findOne({ user_id: updatedFloorMapTable.UpdatedBy }) : null,
      updatedFloorMapTable.floor_id ? Floor.findOne({ Floor_id: updatedFloorMapTable.floor_id }) : null,
      updatedFloorMapTable.table_id ? Table.findOne({ Table_id: updatedFloorMapTable.table_id }) : null
    ]);

    // Create response object with populated data
    const floorMapTableResponse = updatedFloorMapTable.toObject();
    floorMapTableResponse.CreateBy = createByUser ? 
      { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    floorMapTableResponse.UpdatedBy = updatedByUser ? 
      { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
    floorMapTableResponse.floor_id = floorData ? 
      { Floor_id: floorData.Floor_id, Floor_Name: floorData.Floor_Name, Total_Table_Count: floorData.Total_Table_Count } : null;
    floorMapTableResponse.table_id = tableData ? 
      { Table_id: tableData.Table_id, 'Table-name': tableData['Table-name'], 'Table-code': tableData['Table-code'] } : null;
    
    res.status(200).json({
      success: true,
      message: 'Floor map table updated successfully',
      data: floorMapTableResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating floor map table',
      error: error.message
    });
  }
};

// Get Floor Map Table by ID
const getFloorMapTableById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const floorMapTable = await Floor_map_Table.findOne({ floor_map_Table_id: parseInt(id) });
    
    if (!floorMapTable) {
      return res.status(404).json({
        success: false,
        message: 'Floor map table not found'
      });
    }

    // Manually fetch related data
    const [createByUser, updatedByUser, floorData, tableData] = await Promise.all([
      floorMapTable.CreateBy ? User.findOne({ user_id: floorMapTable.CreateBy }) : null,
      floorMapTable.UpdatedBy ? User.findOne({ user_id: floorMapTable.UpdatedBy }) : null,
      floorMapTable.floor_id ? Floor.findOne({ Floor_id: floorMapTable.floor_id }) : null,
      floorMapTable.table_id ? Table.findOne({ Table_id: floorMapTable.table_id }) : null
    ]);

    // Create response object with populated data
    const floorMapTableResponse = floorMapTable.toObject();
    floorMapTableResponse.CreateBy = createByUser ? 
      { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    floorMapTableResponse.UpdatedBy = updatedByUser ? 
      { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
    floorMapTableResponse.floor_id = floorData ? 
      { Floor_id: floorData.Floor_id, Floor_Name: floorData.Floor_Name, Total_Table_Count: floorData.Total_Table_Count } : null;
    floorMapTableResponse.table_id = tableData ? 
      { Table_id: tableData.Table_id, 'Table-name': tableData['Table-name'], 'Table-code': tableData['Table-code'] } : null;

    res.status(200).json({
      success: true,
      data: floorMapTableResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching floor map table',
      error: error.message
    });
  }
};

// Get All Floor Map Tables
const getAllFloorMapTables = async (req, res) => {
  try {
    const floorMapTables = await Floor_map_Table.find().sort({ CreateAt: -1 });

    // Manually fetch related data for all floor map tables
    const floorMapTablesResponse = await Promise.all(floorMapTables.map(async (floorMapTable) => {
      const [createByUser, updatedByUser, floorData, tableData] = await Promise.all([
        floorMapTable.CreateBy ? User.findOne({ user_id: floorMapTable.CreateBy }) : null,
        floorMapTable.UpdatedBy ? User.findOne({ user_id: floorMapTable.UpdatedBy }) : null,
        floorMapTable.floor_id ? Floor.findOne({ Floor_id: floorMapTable.floor_id }) : null,
        floorMapTable.table_id ? Table.findOne({ Table_id: floorMapTable.table_id }) : null
      ]);

      const floorMapTableObj = floorMapTable.toObject();
      floorMapTableObj.CreateBy = createByUser ? 
        { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
      floorMapTableObj.UpdatedBy = updatedByUser ? 
        { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
      floorMapTableObj.floor_id = floorData ? 
        { Floor_id: floorData.Floor_id, Floor_Name: floorData.Floor_Name, Total_Table_Count: floorData.Total_Table_Count } : null;
      floorMapTableObj.table_id = tableData ? 
        { Table_id: tableData.Table_id, 'Table-name': tableData['Table-name'], 'Table-code': tableData['Table-code'] } : null;

      return floorMapTableObj;
    }));

    res.status(200).json({
      success: true,
      count: floorMapTablesResponse.length,
      data: floorMapTablesResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching floor map tables',
      error: error.message
    });
  }
};

// Get Tables by Floor ID
const getTableByFloorId = async (req, res) => {
  try {
    const { floor_id } = req.params;
    
    const floorMapTables = await Floor_map_Table.find({ 
      floor_id: parseInt(floor_id),
      Status: true 
    }).sort({ Row_No: 1 });

    if (!floorMapTables || floorMapTables.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No tables found for this floor'
      });
    }

    // Manually fetch related data for all floor map tables
    const tablesResponse = await Promise.all(floorMapTables.map(async (floorMapTable) => {
      const [createByUser, updatedByUser, floorData, tableData] = await Promise.all([
        floorMapTable.CreateBy ? User.findOne({ user_id: floorMapTable.CreateBy }) : null,
        floorMapTable.UpdatedBy ? User.findOne({ user_id: floorMapTable.UpdatedBy }) : null,
        floorMapTable.floor_id ? Floor.findOne({ Floor_id: floorMapTable.floor_id }) : null,
        floorMapTable.table_id ? Table.findOne({ Table_id: floorMapTable.table_id }) : null
      ]);

      // Fetch nested data for floor (Floor_Type) and table (Table_types and Table-Booking-Status)
      const [floorTypeData, tableTypeData, tableBookingStatusData] = await Promise.all([
        floorData && floorData.Floor_Type_id ? Floor_Type.findOne({ Floor_Type_id: floorData.Floor_Type_id }) : null,
        tableData && tableData.Table_types_id ? Table_types.findOne({ Table_types_id: tableData.Table_types_id }) : null,
        tableData && tableData['Table-Booking-Status_id'] ? Table_Booking_Status.findOne({ 'Table-Booking-Status_id': tableData['Table-Booking-Status_id'] }) : null
      ]);

      const floorMapTableObj = floorMapTable.toObject();
      
      // Ensure Row_No is included in response
      floorMapTableObj.Row_No = floorMapTable.Row_No !== undefined ? floorMapTable.Row_No : null;
      
      // Populate CreateBy and UpdatedBy with full user data
      floorMapTableObj.CreateBy = createByUser ? 
        { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
      floorMapTableObj.UpdatedBy = updatedByUser ? 
        { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
      
      // Populate floor_id with full floor data including nested Floor_Type
      if (floorData) {
        const floorObj = floorData.toObject();
        floorObj.Floor_Type_id = floorTypeData ? 
          { Floor_Type_id: floorTypeData.Floor_Type_id, Floor_Type_Name: floorTypeData.Floor_Type_Name, emozi: floorTypeData.emozi } : null;
        floorMapTableObj.floor_id = floorObj;
      } else {
        floorMapTableObj.floor_id = null;
      }
      
      // Populate table_id with full table data including nested Table_types and Table-Booking-Status
      if (tableData) {
        const tableObj = tableData.toObject();
        tableObj.Table_types_id = tableTypeData ? 
          { Table_types_id: tableTypeData.Table_types_id, Name: tableTypeData.Name, emozi: tableTypeData.emozi } : null;
        tableObj['Table-Booking-Status_id'] = tableBookingStatusData ? 
          { 'Table-Booking-Status_id': tableBookingStatusData['Table-Booking-Status_id'], Name: tableBookingStatusData.Name } : null;
        floorMapTableObj.table_id = tableObj;
      } else {
        floorMapTableObj.table_id = null;
      }

      return floorMapTableObj;
    }));

    // Sort the final array by Row_No (ascending order) to ensure proper ordering
    tablesResponse.sort((a, b) => {
      const rowNoA = a.Row_No !== null && a.Row_No !== undefined ? a.Row_No : 999999;
      const rowNoB = b.Row_No !== null && b.Row_No !== undefined ? b.Row_No : 999999;
      return rowNoA - rowNoB;
    });

    res.status(200).json({
      success: true,
      count: tablesResponse.length,
      data: tablesResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tables by floor ID',
      error: error.message
    });
  }
};

// Delete Floor Map Table
const deleteFloorMapTable = async (req, res) => {
  try {
    const { id } = req.params;
    
    const floorMapTable = await Floor_map_Table.findOne({ floor_map_Table_id: parseInt(id) });
    
    if (!floorMapTable) {
      return res.status(404).json({
        success: false,
        message: 'Floor map table not found'
      });
    }

    await Floor_map_Table.deleteOne({ floor_map_Table_id: parseInt(id) });
    
    res.status(200).json({
      success: true,
      message: 'Floor map table deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting floor map table',
      error: error.message
    });
  }
};

module.exports = {
  createFloorMapTable,
  updateFloorMapTable,
  getFloorMapTableById,
  getAllFloorMapTables,
  getTableByFloorId,
  deleteFloorMapTable
};

