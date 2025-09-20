const Clients = require('../models/Clients.model');
const User = require('../models/User.model');
const Language = require('../models/Language.model');
const Currency = require('../models/currency.model');

// Create Client
const createClient = async (req, res) => {
  try {
    const {
      Business_Name,
      Business_logo,
      Email,
      password,
      language,
      currency,
      type,
      Status
    } = req.body;

    const client = new Clients({
      Business_Name,
      Business_logo,
      Email,
      password,
      language: language || [],
      currency: currency || [],
      type,
      Status: Status !== undefined ? Status : true,
      CreateBy: req.user?.user_id || null
    });

    const savedClient = await client.save();
    
    // Manually fetch related data
    const [createByUser, languages, currencies] = await Promise.all([
      savedClient.CreateBy ? User.findOne({ user_id: savedClient.CreateBy }) : null,
      savedClient.language.length > 0 ? Language.find({ Language_id: { $in: savedClient.language } }) : [],
      savedClient.currency.length > 0 ? Currency.find({ currency_id: { $in: savedClient.currency } }) : []
    ]);

    // Create response object with populated data
    const clientResponse = savedClient.toObject();
    clientResponse.CreateBy = createByUser ? 
      { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    clientResponse.language = languages.map(lang => ({
      Language_id: lang.Language_id,
      Language_name: lang.Language_name
    }));
    clientResponse.currency = currencies.map(curr => ({
      currency_id: curr.currency_id,
      name: curr.name,
      icon: curr.icon
    }));
    
    // Remove password from response
    delete clientResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: clientResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating client',
      error: error.message
    });
  }
};

// Active/Inactive Client Status
const activeInactiveClient = async (req, res) => {
  try {
    const { id, Status } = req.body;
    const userId = req.user.user_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required in request body'
      });
    }

    const client = await Clients.findOne({ Clients_id: parseInt(id) });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    client.Status = Status;
    client.UpdatedBy = userId;
    client.UpdatedAt = new Date();

    const updatedClient = await client.save();
    
    res.status(200).json({
      success: true,
      message: `Client ${Status ? 'activated' : 'deactivated'} successfully`,
      data: {
        Clients_id: updatedClient.Clients_id,
        Business_Name: updatedClient.Business_Name,
        Email: updatedClient.Email,
        Status: updatedClient.Status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating client status',
      error: error.message
    });
  }
};

// Update Client
const updateClient = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const userId = req.user.user_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required in request body'
      });
    }

    const client = await Clients.findOne({ Clients_id: parseInt(id) });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'Clients_id' && key !== 'password') {
        client[key] = updateData[key];
      }
    });

    // Handle password update separately
    if (updateData.password) {
      client.password = updateData.password;
    }

    client.UpdatedBy = userId;
    client.UpdatedAt = new Date();

    const updatedClient = await client.save();
    
    // Manually fetch related data
    const [createByUser, updatedByUser, languages, currencies] = await Promise.all([
      updatedClient.CreateBy ? User.findOne({ user_id: updatedClient.CreateBy }) : null,
      updatedClient.UpdatedBy ? User.findOne({ user_id: updatedClient.UpdatedBy }) : null,
      updatedClient.language.length > 0 ? Language.find({ Language_id: { $in: updatedClient.language } }) : [],
      updatedClient.currency.length > 0 ? Currency.find({ currency_id: { $in: updatedClient.currency } }) : []
    ]);

    // Create response object with populated data
    const clientResponse = updatedClient.toObject();
    clientResponse.CreateBy = createByUser ? 
      { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    clientResponse.UpdatedBy = updatedByUser ? 
      { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
    clientResponse.language = languages.map(lang => ({
      Language_id: lang.Language_id,
      Language_name: lang.Language_name
    }));
    clientResponse.currency = currencies.map(curr => ({
      currency_id: curr.currency_id,
      name: curr.name,
      icon: curr.icon
    }));
    
    // Remove password from response
    delete clientResponse.password;
    
    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: clientResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating client',
      error: error.message
    });
  }
};

// Get Client by ID
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Clients.findOne({ Clients_id: parseInt(id) });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Manually fetch related data
    const [createByUser, updatedByUser, languages, currencies] = await Promise.all([
      client.CreateBy ? User.findOne({ user_id: client.CreateBy }) : null,
      client.UpdatedBy ? User.findOne({ user_id: client.UpdatedBy }) : null,
      client.language.length > 0 ? Language.find({ Language_id: { $in: client.language } }) : [],
      client.currency.length > 0 ? Currency.find({ currency_id: { $in: client.currency } }) : []
    ]);

    // Create response object with populated data
    const clientResponse = client.toObject();
    clientResponse.CreateBy = createByUser ? 
      { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    clientResponse.UpdatedBy = updatedByUser ? 
      { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
    clientResponse.language = languages.map(lang => ({
      Language_id: lang.Language_id,
      Language_name: lang.Language_name
    }));
    clientResponse.currency = currencies.map(curr => ({
      currency_id: curr.currency_id,
      name: curr.name,
      icon: curr.icon
    }));

    // Remove password from response
    delete clientResponse.password;

    res.status(200).json({
      success: true,
      data: clientResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching client',
      error: error.message
    });
  }
};

// Get All Clients
const getAllClients = async (req, res) => {
  try {
    const clients = await Clients.find({ Status: true }).sort({ CreateAt: -1 });

    // Manually fetch related data for all clients
    const clientsResponse = await Promise.all(clients.map(async (client) => {
      const [createByUser, languages, currencies] = await Promise.all([
        client.CreateBy ? User.findOne({ user_id: client.CreateBy }) : null,
        client.language.length > 0 ? Language.find({ Language_id: { $in: client.language } }) : [],
        client.currency.length > 0 ? Currency.find({ currency_id: { $in: client.currency } }) : []
      ]);

      const clientObj = client.toObject();
      clientObj.CreateBy = createByUser ? 
        { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
      clientObj.language = languages.map(lang => ({
        Language_id: lang.Language_id,
        Language_name: lang.Language_name
      }));
      clientObj.currency = currencies.map(curr => ({
        currency_id: curr.currency_id,
        name: curr.name,
        icon: curr.icon
      }));

      // Remove password from response
      delete clientObj.password;

      return clientObj;
    }));

    res.status(200).json({
      success: true,
      count: clientsResponse.length,
      data: clientsResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching clients',
      error: error.message
    });
  }
};

// Get Client by Auth (current logged in user)
const getClientByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const clients = await Clients.find({ CreateBy: userId, Status: true }).sort({ CreateAt: -1 });
    
    if (!clients || clients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clients not found for current user'
      });
    }

    // Manually fetch related data for all clients
    const clientsResponse = await Promise.all(clients.map(async (client) => {
      const [createByUser, updatedByUser, languages, currencies] = await Promise.all([
        client.CreateBy ? User.findOne({ user_id: client.CreateBy }) : null,
        client.UpdatedBy ? User.findOne({ user_id: client.UpdatedBy }) : null,
        client.language.length > 0 ? Language.find({ Language_id: { $in: client.language } }) : [],
        client.currency.length > 0 ? Currency.find({ currency_id: { $in: client.currency } }) : []
      ]);

      const clientObj = client.toObject();
      clientObj.CreateBy = createByUser ? 
        { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
      clientObj.UpdatedBy = updatedByUser ? 
        { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
      clientObj.language = languages.map(lang => ({
        Language_id: lang.Language_id,
        Language_name: lang.Language_name
      }));
      clientObj.currency = currencies.map(curr => ({
        currency_id: curr.currency_id,
        name: curr.name,
        icon: curr.icon
      }));

      // Remove password from response
      delete clientObj.password;

      return clientObj;
    }));

    res.status(200).json({
      success: true,
      count: clientsResponse.length,
      data: clientsResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching clients',
      error: error.message
    });
  }
};

module.exports = {
  createClient,
  activeInactiveClient,
  updateClient,
  getClientById,
  getAllClients,
  getClientByAuth
};
