const Table = require('../models/Table.model');
const Table_types = require('../models/Table_types.model');
const Table_Booking_Status = require('../models/Table-Booking-Status.model');
const User = require('../models/User.model');

// Create Table
const createTable = async (req, res) => {
  try {
    const { 
      Table_types_id, 
      Emozi, 
      image, 
      'Table-name': tableName, 
      'Table-code': tableCode, 
      'Table-booking-price': tableBookingPrice, 
      'Table-Booking-Status_id': tableBookingStatusId, 
      'Seating-Persons_Count': seatingPersonsCount, 
      Details, 
      Status 
    } = req.body;
    const userId = req.user.user_id;

    const table = new Table({
      Table_types_id,
      Emozi,
      image,
      'Table-name': tableName,
      'Table-code': tableCode,
      'Table-booking-price': tableBookingPrice,
      'Table-Booking-Status_id': tableBookingStatusId,
      'Seating-Persons_Count': seatingPersonsCount,
      Details,
      Status,
      CreateBy: userId
    });

    const savedTable = await table.save();
    
    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: savedTable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating table',
      error: error.message
    });
  }
};

// Update Table
const updateTable = async (req, res) => {
  try {
    const { 
      id, 
      Table_types_id, 
      Emozi, 
      image, 
      'Table-name': tableName, 
      'Table-code': tableCode, 
      'Table-booking-price': tableBookingPrice, 
      'Table-Booking-Status_id': tableBookingStatusId, 
      'Seating-Persons_Count': seatingPersonsCount, 
      Details, 
      Status 
    } = req.body;
    const userId = req.user.user_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is required in request body'
      });
    }

    const table = await Table.findOne({ Table_id: parseInt(id) });
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (Table_types_id) table.Table_types_id = Table_types_id;
    if (Emozi) table.Emozi = Emozi;
    if (image !== undefined) table.image = image;
    if (tableName) table['Table-name'] = tableName;
    if (tableCode) table['Table-code'] = tableCode;
    if (tableBookingPrice !== undefined) table['Table-booking-price'] = tableBookingPrice;
    if (tableBookingStatusId) table['Table-Booking-Status_id'] = tableBookingStatusId;
    if (seatingPersonsCount !== undefined) table['Seating-Persons_Count'] = seatingPersonsCount;
    if (Details !== undefined) table.Details = Details;
    if (Status !== undefined) table.Status = Status;
    
    table.UpdatedBy = userId;
    table.UpdatedAt = new Date();

    const updatedTable = await table.save();
    
    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      data: updatedTable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating table',
      error: error.message
    });
  }
};

// Get Table by ID
const getTableById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await Table.findOne({ Table_id: parseInt(id) });
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Manually fetch related data
    const [tableType, tableBookingStatus, createByUser, updatedByUser] = await Promise.all([
      Table_types.findOne({ Table_types_id: table.Table_types_id }),
      Table_Booking_Status.findOne({ 'Table-Booking-Status_id': table['Table-Booking-Status_id'] }),
      table.CreateBy ? User.findOne({ user_id: table.CreateBy }) : null,
      table.UpdatedBy ? User.findOne({ user_id: table.UpdatedBy }) : null
    ]);

    // Create response object with populated data
    const tableResponse = table.toObject();
    tableResponse.Table_types_id = tableType ? { Table_types_id: tableType.Table_types_id, Name: tableType.Name, emozi: tableType.emozi } : null;
    tableResponse['Table-Booking-Status_id'] = tableBookingStatus ? { 'Table-Booking-Status_id': tableBookingStatus['Table-Booking-Status_id'], Name: tableBookingStatus.Name } : null;
    tableResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    tableResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

    res.status(200).json({
      success: true,
      data: tableResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching table',
      error: error.message
    });
  }
};

// Get All Tables
const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find()
      .sort({ CreateAt: -1 });

    // Manually fetch related data for all tables
    const tablesWithPopulatedData = await Promise.all(
      tables.map(async (table) => {
        const [tableType, tableBookingStatus, createByUser, updatedByUser] = await Promise.all([
          Table_types.findOne({ Table_types_id: table.Table_types_id }),
          Table_Booking_Status.findOne({ 'Table-Booking-Status_id': table['Table-Booking-Status_id'] }),
          table.CreateBy ? User.findOne({ user_id: table.CreateBy }) : null,
          table.UpdatedBy ? User.findOne({ user_id: table.UpdatedBy }) : null
        ]);

        const tableResponse = table.toObject();
        tableResponse.Table_types_id = tableType ? { Table_types_id: tableType.Table_types_id, Name: tableType.Name, emozi: tableType.emozi } : null;
        tableResponse['Table-Booking-Status_id'] = tableBookingStatus ? { 'Table-Booking-Status_id': tableBookingStatus['Table-Booking-Status_id'], Name: tableBookingStatus.Name } : null;
        tableResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
        tableResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

        return tableResponse;
      })
    );

    res.status(200).json({
      success: true,
      count: tablesWithPopulatedData.length,
      data: tablesWithPopulatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tables',
      error: error.message
    });
  }
};

// Delete Table
const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    
    const table = await Table.findOne({ Table_id: parseInt(id) });
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    await Table.deleteOne({ Table_id: parseInt(id) });
    
    res.status(200).json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting table',
      error: error.message
    });
  }
};

// Get Table by Auth (current logged in user)
const getTableByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const tables = await Table.find({ CreateBy: userId, Status: true }).sort({ CreateAt: -1 });
    
    if (!tables || tables.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tables not found for current user'
      });
    }

    // Manually fetch related data for all tables
    const tablesResponse = await Promise.all(tables.map(async (table) => {
      const [createByUser, updatedByUser] = await Promise.all([
        table.CreateBy ? User.findOne({ user_id: table.CreateBy }) : null,
        table.UpdatedBy ? User.findOne({ user_id: table.UpdatedBy }) : null
      ]);

      const tableObj = table.toObject();
      tableObj.CreateBy = createByUser ? 
        { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
      tableObj.UpdatedBy = updatedByUser ? 
        { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

      return tableObj;
    }));

    res.status(200).json({
      success: true,
      count: tablesResponse.length,
      data: tablesResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tables',
      error: error.message
    });
  }
};

module.exports = {
  createTable,
  updateTable,
  getTableById,
  getAllTables,
  getTableByAuth,
  deleteTable
};
