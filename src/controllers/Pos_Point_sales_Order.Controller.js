const Pos_Point_sales_Order = require('../models/Pos_Point_sales_Order.model');
const User = require('../models/User.model');
const Items = require('../models/Items.model');
const item_Addons = require('../models/item_Addons.model');
const item_Variants = require('../models/item_Variants.model');
const Customer = require('../models/Customer.model');
const Table = require('../models/Table.model');
const Kitchen = require('../models/Kitchen.model');

// Create POS order with automatic calculations
const createPosOrder = async (req, res) => {
  try {
    const { 
      items, 
      Tax, 
      Customer_id, 
      Dining_Option, 
      Table_id, 
      Kitchen_id, 
      Status 
    } = req.body;
    
    const userId = req.user.user_id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must contain at least one item'
      });
    }

    let totalSubTotal = 0;

    // Validate and calculate prices for each item
    for (const itemData of items) {
      const { item_id, item_Quentry, item_Addons_id, item_Variants_id } = itemData;
      
      if (!item_id || !item_Quentry) {
        return res.status(400).json({
          success: false,
          message: 'item_id and item_Quentry are required for each item'
        });
      }

      // Fetch item details to calculate prices
      const item = await Items.findOne({ Items_id: parseInt(item_id) });
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Item with ID ${item_id} not found`
        });
      }

      // Calculate base price
      let basePrice = item.prices || 0;
      let addonPrice = 0;
      let variantPrice = 0;

      // Calculate addon price if provided
      if (item_Addons_id) {
        const addon = await item_Addons.findOne({ item_Addons_id: parseInt(item_Addons_id) });
        if (addon) {
          addonPrice = addon.prices || 0;
        }
      }

      // Calculate variant price if provided
      if (item_Variants_id) {
        const variant = await item_Variants.findOne({ item_Variants_id: parseInt(item_Variants_id) });
        if (variant) {
          variantPrice = variant.prices || 0;
        }
      }

      // Calculate item subtotal: (base price + addon price + variant price) * quantity
      const unitPrice = basePrice + addonPrice + variantPrice;
      const itemSubTotal = unitPrice * item_Quentry;
      totalSubTotal += itemSubTotal;
    }

    // Calculate total: subtotal + tax
    const Total = totalSubTotal + Tax;

    const posOrder = new Pos_Point_sales_Order({
      items,
      Tax,
      SubTotal: totalSubTotal,
      Total,
      Customer_id,
      Dining_Option,
      Table_id,
      Kitchen_id,
      Status,
      CreateBy: userId
    });

    const savedPosOrder = await posOrder.save();
    
    res.status(201).json({
      success: true,
      message: 'POS order created successfully',
      data: savedPosOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating POS order',
      error: error.message
    });
  }
};

// Update POS order
const updatePosOrder = async (req, res) => {
  try {
    const { 
      id, 
      items, 
      Tax, 
      Customer_id, 
      Dining_Option, 
      Table_id, 
      Kitchen_id, 
      Status 
    } = req.body;
    
    const userId = req.user.user_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'POS order ID is required in request body'
      });
    }

    const posOrder = await Pos_Point_sales_Order.findOne({ POS_Order_id: parseInt(id) });
    if (!posOrder) {
      return res.status(404).json({
        success: false,
        message: 'POS order not found'
      });
    }

    // Update fields if provided
    if (items !== undefined) posOrder.items = items;
    if (Tax !== undefined) posOrder.Tax = Tax;
    if (Customer_id !== undefined) posOrder.Customer_id = Customer_id;
    if (Dining_Option !== undefined) posOrder.Dining_Option = Dining_Option;
    if (Table_id !== undefined) posOrder.Table_id = Table_id;
    if (Kitchen_id !== undefined) posOrder.Kitchen_id = Kitchen_id;
    if (Status !== undefined) posOrder.Status = Status;

    // Recalculate prices if items changed
    if (items !== undefined) {
      let totalSubTotal = 0;

      // Validate and calculate prices for each item
      for (const itemData of posOrder.items) {
        const { item_id, item_Quentry, item_Addons_id, item_Variants_id } = itemData;
        
        if (!item_id || !item_Quentry) {
          return res.status(400).json({
            success: false,
            message: 'item_id and item_Quentry are required for each item'
          });
        }

        // Fetch item details to calculate prices
        const item = await Items.findOne({ Items_id: parseInt(item_id) });
        if (!item) {
          return res.status(404).json({
            success: false,
            message: `Item with ID ${item_id} not found`
          });
        }

        // Calculate base price
        let basePrice = item.prices || 0;
        let addonPrice = 0;
        let variantPrice = 0;

        // Calculate addon price if provided
        if (item_Addons_id) {
          const addon = await item_Addons.findOne({ item_Addons_id: parseInt(item_Addons_id) });
          if (addon) {
            addonPrice = addon.prices || 0;
          }
        }

        // Calculate variant price if provided
        if (item_Variants_id) {
          const variant = await item_Variants.findOne({ item_Variants_id: parseInt(item_Variants_id) });
          if (variant) {
            variantPrice = variant.prices || 0;
          }
        }

        // Calculate item subtotal: (base price + addon price + variant price) * quantity
        const unitPrice = basePrice + addonPrice + variantPrice;
        const itemSubTotal = unitPrice * item_Quentry;
        totalSubTotal += itemSubTotal;
      }

      posOrder.SubTotal = totalSubTotal;
      posOrder.Total = totalSubTotal + posOrder.Tax;
    }
    
    posOrder.UpdatedBy = userId;
    posOrder.UpdatedAt = new Date();

    const updatedPosOrder = await posOrder.save();
    
    res.status(200).json({
      success: true,
      message: 'POS order updated successfully',
      data: updatedPosOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating POS order',
      error: error.message
    });
  }
};

// Get POS order by ID
const getPosOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const posOrder = await Pos_Point_sales_Order.findOne({ POS_Order_id: parseInt(id) });
    
    if (!posOrder) {
      return res.status(404).json({
        success: false,
        message: 'POS order not found'
      });
    }

    // Manually fetch related data
    const [createByUser, updatedByUser, customer, table, kitchen] = await Promise.all([
      posOrder.CreateBy ? User.findOne({ user_id: posOrder.CreateBy }) : null,
      posOrder.UpdatedBy ? User.findOne({ user_id: posOrder.UpdatedBy }) : null,
      posOrder.Customer_id ? Customer.findOne({ Customer_id: posOrder.Customer_id }) : null,
      posOrder.Table_id ? Table.findOne({ table_id: posOrder.Table_id }) : null,
      posOrder.Kitchen_id ? Kitchen.findOne({ kitchen_id: posOrder.Kitchen_id }) : null
    ]);

    // Populate items array with detailed information
    const populatedItems = await Promise.all(
      posOrder.items.map(async (itemData) => {
        const { item_id, item_Quentry, item_Addons_id, item_Variants_id } = itemData;
        
        const [item, addon, variant] = await Promise.all([
          Items.findOne({ Items_id: parseInt(item_id) }),
          item_Addons_id ? item_Addons.findOne({ item_Addons_id: parseInt(item_Addons_id) }) : null,
          item_Variants_id ? item_Variants.findOne({ item_Variants_id: parseInt(item_Variants_id) }) : null
        ]);

        return {
          item_id,
          item_Quentry,
          item_Addons_id,
          item_Variants_id,
          Item: item ? { item_id: item.Items_id, item_name: item.item_name, prices: item.prices } : null,
          Addon: addon ? { item_Addons_id: addon.item_Addons_id, Addons: addon.Addons, prices: addon.prices } : null,
          Variant: variant ? { item_Variants_id: variant.item_Variants_id, Variants: variant.Variants, prices: variant.prices } : null
        };
      })
    );

    // Create response object with populated data
    const posOrderResponse = posOrder.toObject();
    posOrderResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    posOrderResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
    posOrderResponse.items = populatedItems;
    posOrderResponse.Customer = customer ? { Customer_id: customer.Customer_id, Name: customer.Name, phone: customer.phone } : null;
    posOrderResponse.Table = table ? { table_id: table.table_id, table_name: table.table_name } : null;
    posOrderResponse.Kitchen = kitchen ? { kitchen_id: kitchen.kitchen_id, kitchen_name: kitchen.kitchen_name } : null;

    res.status(200).json({
      success: true,
      data: posOrderResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching POS order',
      error: error.message
    });
  }
};

// Get all POS orders
const getAllPosOrders = async (req, res) => {
  try {
    const posOrders = await Pos_Point_sales_Order.find()
      .sort({ CreateAt: -1 });

    // Manually fetch related data for all POS orders
    const posOrdersWithPopulatedData = await Promise.all(
      posOrders.map(async (posOrder) => {
        const [createByUser, updatedByUser, customer, table, kitchen] = await Promise.all([
          posOrder.CreateBy ? User.findOne({ user_id: posOrder.CreateBy }) : null,
          posOrder.UpdatedBy ? User.findOne({ user_id: posOrder.UpdatedBy }) : null,
          posOrder.Customer_id ? Customer.findOne({ Customer_id: posOrder.Customer_id }) : null,
          posOrder.Table_id ? Table.findOne({ table_id: posOrder.Table_id }) : null,
          posOrder.Kitchen_id ? Kitchen.findOne({ kitchen_id: posOrder.kitchen_id }) : null
        ]);

        // Populate items array with detailed information
        const populatedItems = await Promise.all(
          posOrder.items.map(async (itemData) => {
            const { item_id, item_Quentry, item_Addons_id, item_Variants_id } = itemData;
            
            const [item, addon, variant] = await Promise.all([
              Items.findOne({ Items_id: parseInt(item_id) }),
              item_Addons_id ? item_Addons.findOne({ item_Addons_id: parseInt(item_Addons_id) }) : null,
              item_Variants_id ? item_Variants.findOne({ item_Variants_id: parseInt(item_Variants_id) }) : null
            ]);

            return {
              item_id,
              item_Quentry,
              item_Addons_id,
              item_Variants_id,
              Item: item ? { item_id: item.Items_id, item_name: item.item_name, prices: item.prices } : null,
              Addon: addon ? { item_Addons_id: addon.item_Addons_id, Addons: addon.Addons, prices: addon.prices } : null,
              Variant: variant ? { item_Variants_id: variant.item_Variants_id, Variants: variant.Variants, prices: variant.prices } : null
            };
          })
        );

        const posOrderResponse = posOrder.toObject();
        posOrderResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
        posOrderResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
        posOrderResponse.items = populatedItems;
        posOrderResponse.Customer = customer ? { Customer_id: customer.Customer_id, Name: customer.Name, phone: customer.phone } : null;
        posOrderResponse.Table = table ? { table_id: table.table_id, table_name: table.table_name } : null;
        posOrderResponse.Kitchen = kitchen ? { kitchen_id: kitchen.kitchen_id, kitchen_name: kitchen.kitchen_name } : null;

        return posOrderResponse;
      })
    );

    res.status(200).json({
      success: true,
      count: posOrdersWithPopulatedData.length,
      data: posOrdersWithPopulatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching POS orders',
      error: error.message
    });
  }
};

// Get POS orders by authenticated user
const getPosOrdersByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const posOrders = await Pos_Point_sales_Order.find({ CreateBy: userId })
      .sort({ CreateAt: -1 });

    // Manually fetch related data for all POS orders
    const posOrdersWithPopulatedData = await Promise.all(
      posOrders.map(async (posOrder) => {
        const [createByUser, updatedByUser, customer, table, kitchen] = await Promise.all([
          posOrder.CreateBy ? User.findOne({ user_id: posOrder.CreateBy }) : null,
          posOrder.UpdatedBy ? User.findOne({ user_id: posOrder.UpdatedBy }) : null,
          posOrder.Customer_id ? Customer.findOne({ Customer_id: posOrder.Customer_id }) : null,
          posOrder.Table_id ? Table.findOne({ table_id: posOrder.Table_id }) : null,
          posOrder.Kitchen_id ? Kitchen.findOne({ kitchen_id: posOrder.Kitchen_id }) : null
        ]);

        // Populate items array with detailed information
        const populatedItems = await Promise.all(
          posOrder.items.map(async (itemData) => {
            const { item_id, item_Quentry, item_Addons_id, item_Variants_id } = itemData;
            
            const [item, addon, variant] = await Promise.all([
              Items.findOne({ Items_id: parseInt(item_id) }),
              item_Addons_id ? item_Addons.findOne({ item_Addons_id: parseInt(item_Addons_id) }) : null,
              item_Variants_id ? item_Variants.findOne({ item_Variants_id: parseInt(item_Variants_id) }) : null
            ]);

            return {
              item_id,
              item_Quentry,
              item_Addons_id,
              item_Variants_id,
              Item: item ? { item_id: item.Items_id, item_name: item.item_name, prices: item.prices } : null,
              Addon: addon ? { item_Addons_id: addon.item_Addons_id, Addons: addon.Addons, prices: addon.prices } : null,
              Variant: variant ? { item_Variants_id: variant.item_Variants_id, Variants: variant.Variants, prices: variant.prices } : null
            };
          })
        );

        const posOrderResponse = posOrder.toObject();
        posOrderResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
        posOrderResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
        posOrderResponse.items = populatedItems;
        posOrderResponse.Customer = customer ? { Customer_id: customer.Customer_id, Name: customer.Name, phone: customer.phone } : null;
        posOrderResponse.Table = table ? { table_id: table.table_id, table_name: table.table_name } : null;
        posOrderResponse.Kitchen = kitchen ? { kitchen_id: kitchen.kitchen_id, kitchen_name: kitchen.kitchen_name } : null;

        return posOrderResponse;
      })
    );

    res.status(200).json({
      success: true,
      count: posOrdersWithPopulatedData.length,
      data: posOrdersWithPopulatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching POS orders by user',
      error: error.message
    });
  }
};

// Delete POS Order
const deletePosOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const posOrder = await Pos_Point_sales_Order.findOne({ POS_Order_id: parseInt(id) });
    
    if (!posOrder) {
      return res.status(404).json({
        success: false,
        message: 'POS order not found'
      });
    }

    await Pos_Point_sales_Order.deleteOne({ POS_Order_id: parseInt(id) });
    
    res.status(200).json({
      success: true,
      message: 'POS order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting POS order',
      error: error.message
    });
  }
};

module.exports = {
  createPosOrder,
  updatePosOrder,
  getPosOrderById,
  getAllPosOrders,
  getPosOrdersByAuth,
  deletePosOrder
};
