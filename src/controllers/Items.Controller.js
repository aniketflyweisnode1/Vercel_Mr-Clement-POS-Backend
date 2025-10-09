const Items = require('../models/Items.model');
const Items_types = require('../models/Items_types.model');
const User = require('../models/User.model');

// Create Items
const createItems = async (req, res) => {
  try {
    const { 
      Items_types_id, 
      Emozi, 
      image, 
      'item-name': itemName, 
      'item-code': itemCode, 
      'item-size': itemSize, 
      'item-price': itemPrice, 
      'item-quantity': itemQuantity, 
      'item-stock-quantity': itemStockQuantity, 
      Details, 
      Status 
    } = req.body;
    const userId = req.user.user_id;

    const items = new Items({
      Items_types_id,
      Emozi,
      image,
      'item-name': itemName,
      'item-code': itemCode,
      'item-size': itemSize,
      'item-price': itemPrice,
      'item-quantity': itemQuantity,
      'item-stock-quantity': itemStockQuantity,
      Details,
      Status,
      CreateBy: userId
    });

    const savedItems = await items.save();
    
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: savedItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating item',
      error: error.message
    });
  }
};

// Update Items
const updateItems = async (req, res) => {
  try {
    const { 
      id, 
      Items_types_id, 
      Emozi, 
      image, 
      'item-name': itemName, 
      'item-code': itemCode, 
      'item-size': itemSize, 
      'item-price': itemPrice, 
      'item-quantity': itemQuantity, 
      'item-stock-quantity': itemStockQuantity, 
      Details, 
      Status 
    } = req.body;
    const userId = req.user.user_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required in request body'
      });
    }

    const items = await Items.findOne({ Items_id: parseInt(id) });
    if (!items) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (Items_types_id) items.Items_types_id = Items_types_id;
    if (Emozi) items.Emozi = Emozi;
    if (image !== undefined) items.image = image;
    if (itemName) items['item-name'] = itemName;
    if (itemCode) items['item-code'] = itemCode;
    if (itemSize !== undefined) items['item-size'] = itemSize;
    if (itemPrice !== undefined) items['item-price'] = itemPrice;
    if (itemQuantity !== undefined) items['item-quantity'] = itemQuantity;
    if (itemStockQuantity !== undefined) items['item-stock-quantity'] = itemStockQuantity;
    if (Details !== undefined) items.Details = Details;
    if (Status !== undefined) items.Status = Status;
    
    items.UpdatedBy = userId;
    items.UpdatedAt = new Date();

    const updatedItems = await items.save();
    
    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating item',
      error: error.message
    });
  }
};

// Get Items by ID
const getItemsById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const items = await Items.findOne({ Items_id: parseInt(id) });
    
    if (!items) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Manually fetch related data
    const [itemsType, createByUser, updatedByUser] = await Promise.all([
      Items_types.findOne({ Items_types_id: items.Items_types_id }),
      items.CreateBy ? User.findOne({ user_id: items.CreateBy }) : null,
      items.UpdatedBy ? User.findOne({ user_id: items.UpdatedBy }) : null
    ]);

    // Create response object with populated data
    const itemsResponse = items.toObject();
    itemsResponse.Items_types_id = itemsType ? { Items_types_id: itemsType.Items_types_id, Name: itemsType.Name, emozi: itemsType.emozi } : null;
    itemsResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    itemsResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

    res.status(200).json({
      success: true,
      data: itemsResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching item',
      error: error.message
    });
  }
};

// Get All Items
const getAllItems = async (req, res) => {
  try {
    const items = await Items.find()
      .sort({ CreateAt: -1 });

    // Manually fetch related data for all items
    const itemsWithPopulatedData = await Promise.all(
      items.map(async (item) => {
        const [itemsType, createByUser, updatedByUser] = await Promise.all([
          Items_types.findOne({ Items_types_id: item.Items_types_id }),
          item.CreateBy ? User.findOne({ user_id: item.CreateBy }) : null,
          item.UpdatedBy ? User.findOne({ user_id: item.UpdatedBy }) : null
        ]);

        const itemResponse = item.toObject();
        itemResponse.Items_types_id = itemsType ? { Items_types_id: itemsType.Items_types_id, Name: itemsType.Name, emozi: itemsType.emozi } : null;
        itemResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
        itemResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

        return itemResponse;
      })
    );

    res.status(200).json({
      success: true,
      count: itemsWithPopulatedData.length,
      data: itemsWithPopulatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    });
  }
};

// Delete Items
const deleteItems = async (req, res) => {
  try {
    const { id } = req.params;
    
    const items = await Items.findOne({ Items_id: parseInt(id) });
    
    if (!items) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    await Items.deleteOne({ Items_id: parseInt(id) });
    
    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting item',
      error: error.message
    });
  }
};

// Get Items by Auth (current logged in user)
const getItemsByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const items = await Items.find({ CreateBy: userId, Status: true }).sort({ CreateAt: -1 });
    
    if (!items || items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Items not found for current user'
      });
    }

    // Manually fetch related data for all items
    const itemsResponse = await Promise.all(items.map(async (item) => {
      const [itemsType, createByUser, updatedByUser] = await Promise.all([
        Items_types.findOne({ Items_types_id: item.Items_types_id }),
        item.CreateBy ? User.findOne({ user_id: item.CreateBy }) : null,
        item.UpdatedBy ? User.findOne({ user_id: item.UpdatedBy }) : null
      ]);

      const itemObj = item.toObject();
      itemObj.Items_types_id = itemsType ? 
        { Items_types_id: itemsType.Items_types_id, Name: itemsType.Name, emozi: itemsType.emozi } : null;
      itemObj.CreateBy = createByUser ? 
        { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
      itemObj.UpdatedBy = updatedByUser ? 
        { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

      return itemObj;
    }));

    res.status(200).json({
      success: true,
      count: itemsResponse.length,
      data: itemsResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    });
  }
};

// Get Items by Item Type ID
const getItemsByItemTypeId = async (req, res) => {
  try {
    const { itemTypeId } = req.params;
    
    if (!itemTypeId) {
      return res.status(400).json({
        success: false,
        message: 'Item Type ID is required'
      });
    }

    // Check if item type exists
    const itemType = await Items_types.findOne({ Items_types_id: parseInt(itemTypeId) });
    if (!itemType) {
      return res.status(404).json({
        success: false,
        message: 'Item Type not found'
      });
    }

    const items = await Items.find({ Items_types_id: parseInt(itemTypeId) })
      .sort({ CreateAt: -1 });
    
    if (!items || items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No items found for this item type'
      });
    }

    // Manually fetch related data for all items
    const itemsWithPopulatedData = await Promise.all(
      items.map(async (item) => {
        const [itemsType, createByUser, updatedByUser] = await Promise.all([
          Items_types.findOne({ Items_types_id: item.Items_types_id }),
          item.CreateBy ? User.findOne({ user_id: item.CreateBy }) : null,
          item.UpdatedBy ? User.findOne({ user_id: item.UpdatedBy }) : null
        ]);

        const itemResponse = item.toObject();
        itemResponse.Items_types_id = itemsType ? { Items_types_id: itemsType.Items_types_id, Name: itemsType.Name, emozi: itemsType.emozi } : null;
        itemResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
        itemResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

        return itemResponse;
      })
    );

    res.status(200).json({
      success: true,
      count: itemsWithPopulatedData.length,
      itemType: {
        Items_types_id: itemType.Items_types_id,
        Name: itemType.Name,
        emozi: itemType.emozi
      },
      data: itemsWithPopulatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching items by item type',
      error: error.message
    });
  }
};

module.exports = {
  createItems,
  updateItems,
  getItemsById,
  getAllItems,
  getItemsByAuth,
  deleteItems,
  getItemsByItemTypeId
};
