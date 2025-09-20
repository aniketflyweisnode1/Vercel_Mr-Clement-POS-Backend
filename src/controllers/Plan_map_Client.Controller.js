const Plan_map_Client = require('../models/Plan_map_Client.model');
const User = require('../models/User.model');
const Clients = require('../models/Clients.model');
const Plan = require('../models/Plan.model');

// Create Plan Map Client
const createPlanMapClient = async (req, res) => {
  try {
    const {
      client_id,
      plan_id,
      Status
    } = req.body;

    const planMapClient = new Plan_map_Client({
      client_id,
      plan_id,
      Status: Status !== undefined ? Status : true,
      CreateBy: req.user?.user_id || null
    });

    const savedPlanMapClient = await planMapClient.save();
    
    // Manually fetch related data
    const [createByUser, client, plan] = await Promise.all([
      savedPlanMapClient.CreateBy ? User.findOne({ user_id: savedPlanMapClient.CreateBy }) : null,
      savedPlanMapClient.client_id ? Clients.findOne({ Clients_id: savedPlanMapClient.client_id }) : null,
      savedPlanMapClient.plan_id ? Plan.findOne({ Plan_id: savedPlanMapClient.plan_id }) : null
    ]);

    // Create response object with populated data
    const planMapClientResponse = savedPlanMapClient.toObject();
    planMapClientResponse.CreateBy = createByUser ? 
      { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    planMapClientResponse.client_id = client ? 
      { Clients_id: client.Clients_id, Business_Name: client.Business_Name, Email: client.Email } : null;
    planMapClientResponse.plan_id = plan ? 
      { Plan_id: plan.Plan_id, name: plan.name, plan_duration: plan.plan_duration } : null;
    
    res.status(201).json({
      success: true,
      message: 'Plan map client created successfully',
      data: planMapClientResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating plan map client',
      error: error.message
    });
  }
};

// Update Plan Map Client
const updatePlanMapClient = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const userId = req.user.user_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Plan Map Client ID is required in request body'
      });
    }

    const planMapClient = await Plan_map_Client.findOne({ Plan_map_Client_id: parseInt(id) });
    if (!planMapClient) {
      return res.status(404).json({
        success: false,
        message: 'Plan map client not found'
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'Plan_map_Client_id') {
        planMapClient[key] = updateData[key];
      }
    });

    planMapClient.UpdatedBy = userId;
    planMapClient.UpdatedAt = new Date();

    const updatedPlanMapClient = await planMapClient.save();
    
    // Manually fetch related data
    const [createByUser, updatedByUser, client, plan] = await Promise.all([
      updatedPlanMapClient.CreateBy ? User.findOne({ user_id: updatedPlanMapClient.CreateBy }) : null,
      updatedPlanMapClient.UpdatedBy ? User.findOne({ user_id: updatedPlanMapClient.UpdatedBy }) : null,
      updatedPlanMapClient.client_id ? Clients.findOne({ Clients_id: updatedPlanMapClient.client_id }) : null,
      updatedPlanMapClient.plan_id ? Plan.findOne({ Plan_id: updatedPlanMapClient.plan_id }) : null
    ]);

    // Create response object with populated data
    const planMapClientResponse = updatedPlanMapClient.toObject();
    planMapClientResponse.CreateBy = createByUser ? 
      { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    planMapClientResponse.UpdatedBy = updatedByUser ? 
      { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
    planMapClientResponse.client_id = client ? 
      { Clients_id: client.Clients_id, Business_Name: client.Business_Name, Email: client.Email } : null;
    planMapClientResponse.plan_id = plan ? 
      { Plan_id: plan.Plan_id, name: plan.name, plan_duration: plan.plan_duration } : null;
    
    res.status(200).json({
      success: true,
      message: 'Plan map client updated successfully',
      data: planMapClientResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating plan map client',
      error: error.message
    });
  }
};

// Get Plan Map Client by ID
const getPlanMapClientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const planMapClient = await Plan_map_Client.findOne({ Plan_map_Client_id: parseInt(id) });
    
    if (!planMapClient) {
      return res.status(404).json({
        success: false,
        message: 'Plan map client not found'
      });
    }

    // Manually fetch related data
    const [createByUser, updatedByUser, client, plan] = await Promise.all([
      planMapClient.CreateBy ? User.findOne({ user_id: planMapClient.CreateBy }) : null,
      planMapClient.UpdatedBy ? User.findOne({ user_id: planMapClient.UpdatedBy }) : null,
      planMapClient.client_id ? Clients.findOne({ Clients_id: planMapClient.client_id }) : null,
      planMapClient.plan_id ? Plan.findOne({ Plan_id: planMapClient.plan_id }) : null
    ]);

    // Create response object with populated data
    const planMapClientResponse = planMapClient.toObject();
    planMapClientResponse.CreateBy = createByUser ? 
      { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    planMapClientResponse.UpdatedBy = updatedByUser ? 
      { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
    planMapClientResponse.client_id = client ? 
      { Clients_id: client.Clients_id, Business_Name: client.Business_Name, Email: client.Email } : null;
    planMapClientResponse.plan_id = plan ? 
      { Plan_id: plan.Plan_id, name: plan.name, plan_duration: plan.plan_duration } : null;

    res.status(200).json({
      success: true,
      data: planMapClientResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching plan map client',
      error: error.message
    });
  }
};

// Get All Plan Map Clients
const getAllPlanMapClients = async (req, res) => {
  try {
    const planMapClients = await Plan_map_Client.find({ Status: true }).sort({ CreateAt: -1 });

    // Manually fetch related data for all plan map clients
    const planMapClientsResponse = await Promise.all(planMapClients.map(async (planMapClient) => {
      const [createByUser, client, plan] = await Promise.all([
        planMapClient.CreateBy ? User.findOne({ user_id: planMapClient.CreateBy }) : null,
        planMapClient.client_id ? Clients.findOne({ Clients_id: planMapClient.client_id }) : null,
        planMapClient.plan_id ? Plan.findOne({ Plan_id: planMapClient.plan_id }) : null
      ]);

      const planMapClientObj = planMapClient.toObject();
      planMapClientObj.CreateBy = createByUser ? 
        { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
      planMapClientObj.client_id = client ? 
        { Clients_id: client.Clients_id, Business_Name: client.Business_Name, Email: client.Email } : null;
      planMapClientObj.plan_id = plan ? 
        { Plan_id: plan.Plan_id, name: plan.name, plan_duration: plan.plan_duration } : null;

      return planMapClientObj;
    }));

    res.status(200).json({
      success: true,
      count: planMapClientsResponse.length,
      data: planMapClientsResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching plan map clients',
      error: error.message
    });
  }
};

// Get Plan Map Client by Auth (current logged in user)
const getPlanMapClientByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const planMapClients = await Plan_map_Client.find({ CreateBy: userId, Status: true }).sort({ CreateAt: -1 });
    
    if (!planMapClients || planMapClients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan map clients not found for current user'
      });
    }

    // Manually fetch related data for all plan map clients
    const planMapClientsResponse = await Promise.all(planMapClients.map(async (planMapClient) => {
      const [createByUser, updatedByUser, client, plan] = await Promise.all([
        planMapClient.CreateBy ? User.findOne({ user_id: planMapClient.CreateBy }) : null,
        planMapClient.UpdatedBy ? User.findOne({ user_id: planMapClient.UpdatedBy }) : null,
        planMapClient.client_id ? Clients.findOne({ Clients_id: planMapClient.client_id }) : null,
        planMapClient.plan_id ? Plan.findOne({ Plan_id: planMapClient.plan_id }) : null
      ]);

      const planMapClientObj = planMapClient.toObject();
      planMapClientObj.CreateBy = createByUser ? 
        { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
      planMapClientObj.UpdatedBy = updatedByUser ? 
        { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
      planMapClientObj.client_id = client ? 
        { Clients_id: client.Clients_id, Business_Name: client.Business_Name, Email: client.Email } : null;
      planMapClientObj.plan_id = plan ? 
        { Plan_id: plan.Plan_id, name: plan.name, plan_duration: plan.plan_duration } : null;

      return planMapClientObj;
    }));

    res.status(200).json({
      success: true,
      count: planMapClientsResponse.length,
      data: planMapClientsResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching plan map clients',
      error: error.message
    });
  }
};

module.exports = {
  createPlanMapClient,
  updatePlanMapClient,
  getPlanMapClientById,
  getAllPlanMapClients,
  getPlanMapClientByAuth
};
