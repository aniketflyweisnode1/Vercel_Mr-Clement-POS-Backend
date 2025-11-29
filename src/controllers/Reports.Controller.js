const Pos_Point_sales_Order = require('../models/Pos_Point_sales_Order.model');
const Quick_Order = require('../models/Quick_Order.model');
const Customer = require('../models/Customer.model');
const Items = require('../models/Items.model');
const Tokens = require('../models/Tokens.model');
const Invoices = require('../models/Invoices.model');
const Clients = require('../models/Clients.model');
const User = require('../models/User.model');
const Role = require('../models/Role.model');

// Helper function to get date range based on period
const getDateRange = (period) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: startOfDay,
        end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      };
    case 'six_month':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 6, 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      };
    case 'one_year':
      return {
        start: new Date(now.getFullYear() - 1, now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      };
    default:
      return {
        start: startOfDay,
        end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      };
  }
};

// Helper function to get top sellers
const getTopSellers = async (dateRange) => {
  try {
    // Get POS orders in date range
    const posOrders = await Pos_Point_sales_Order.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    }).populate('items.item_id', 'item-name');

    // Get Quick orders in date range
    const quickOrders = await Quick_Order.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    }).populate('item_ids.item_id', 'item-name');

    // Combine and count items
    const itemCounts = {};

    // Process POS orders
    posOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.item_id) {
          const itemName = item.item_id['item-name'];
          const quantity = item.item_Quentry || 0;
          itemCounts[itemName] = (itemCounts[itemName] || 0) + quantity;
        }
      });
    });

    // Process Quick orders
    quickOrders.forEach(order => {
      order.item_ids.forEach(item => {
        if (item.item_id) {
          const itemName = item.item_id['item-name'];
          const quantity = item.quantity || 0;
          itemCounts[itemName] = (itemCounts[itemName] || 0) + quantity;
        }
      });
    });

    // Convert to array and sort by quantity
    const topSellers = Object.entries(itemCounts)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10); // Top 10

    return topSellers;
  } catch (error) {
    console.error('Error getting top sellers:', error);
    return [];
  }
};

// Helper function to get payment breakdown
const getPaymentBreakdown = async (dateRange) => {
  try {
    // Get tokens used in date range
    const tokens = await Tokens.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    // Count payment types
    const paymentCounts = {
      card: 0,
      cash: 0,
      'Apple pay': 0,
      'G pay': 0,
      'Gift Coupon': 0
    };

    tokens.forEach(token => {
      const tokenName = token.TokenName.toLowerCase();
      if (tokenName.includes('card')) {
        paymentCounts.card++;
      } else if (tokenName.includes('cash')) {
        paymentCounts.cash++;
      } else if (tokenName.includes('apple')) {
        paymentCounts['Apple pay']++;
      } else if (tokenName.includes('google') || tokenName.includes('g pay')) {
        paymentCounts['G pay']++;
      } else if (tokenName.includes('gift') || tokenName.includes('coupon')) {
        paymentCounts['Gift Coupon']++;
      }
    });

    return paymentCounts;
  } catch (error) {
    console.error('Error getting payment breakdown:', error);
    return {
      card: 0,
      cash: 0,
      'Apple pay': 0,
      'G pay': 0,
      'Gift Coupon': 0
    };
  }
};

// Reports Today
const reportsToday = async (req, res) => {
  try {
    const dateRange = getDateRange('today');
    
    // Get orders in date range
    const posOrders = await Pos_Point_sales_Order.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    const quickOrders = await Quick_Order.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    // Get customers in date range
    const customers = await Customer.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    // Get all customers for repeat customer calculation
    const allCustomers = await Customer.find({ Status: true });
    const customerOrderCounts = {};

    // Count orders per customer
    [...posOrders, ...quickOrders].forEach(order => {
      if (order.Customer_id) {
        customerOrderCounts[order.Customer_id] = (customerOrderCounts[order.Customer_id] || 0) + 1;
      }
    });

    const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
    const newCustomers = customers.length;

    // Calculate totals
    const totalOrders = posOrders.length + quickOrders.length;
    const totalSales = [...posOrders, ...quickOrders].reduce((sum, order) => sum + (order.Total || 0), 0);
    const totalTax = [...posOrders, ...quickOrders].reduce((sum, order) => sum + (order.Tax || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get top sellers and payment breakdown
    const topSellers = await getTopSellers(dateRange);
    const paymentBreakdown = await getPaymentBreakdown(dateRange);

    const report = {
      period: 'Today',
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      topSellers,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalCustomers: allCustomers.length,
      newCustomers,
      repeatCustomers,
      netSales: totalSales,
      tax: totalTax,
      payment: paymentBreakdown
    };

    res.status(200).json({
      success: true,
      message: 'Today\'s report generated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error generating today\'s report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating today\'s report',
      error: error.message
    });
  }
};

// Reports Month
const reportsMonth = async (req, res) => {
  try {
    const dateRange = getDateRange('month');
    
    // Get orders in date range
    const posOrders = await Pos_Point_sales_Order.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    const quickOrders = await Quick_Order.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    // Get customers in date range
    const customers = await Customer.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    // Get all customers for repeat customer calculation
    const allCustomers = await Customer.find({ Status: true });
    const customerOrderCounts = {};

    // Count orders per customer
    [...posOrders, ...quickOrders].forEach(order => {
      if (order.Customer_id) {
        customerOrderCounts[order.Customer_id] = (customerOrderCounts[order.Customer_id] || 0) + 1;
      }
    });

    const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
    const newCustomers = customers.length;

    // Calculate totals
    const totalOrders = posOrders.length + quickOrders.length;
    const totalSales = [...posOrders, ...quickOrders].reduce((sum, order) => sum + (order.Total || 0), 0);
    const totalTax = [...posOrders, ...quickOrders].reduce((sum, order) => sum + (order.Tax || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get top sellers and payment breakdown
    const topSellers = await getTopSellers(dateRange);
    const paymentBreakdown = await getPaymentBreakdown(dateRange);

    const report = {
      period: 'This Month',
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      topSellers,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalCustomers: allCustomers.length,
      newCustomers,
      repeatCustomers,
      netSales: totalSales,
      tax: totalTax,
      payment: paymentBreakdown
    };

    res.status(200).json({
      success: true,
      message: 'Monthly report generated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating monthly report',
      error: error.message
    });
  }
};

// Reports Six Month
const reportsSixMonth = async (req, res) => {
  try {
    const dateRange = getDateRange('six_month');
    
    // Get orders in date range
    const posOrders = await Pos_Point_sales_Order.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    const quickOrders = await Quick_Order.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    // Get customers in date range
    const customers = await Customer.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    // Get all customers for repeat customer calculation
    const allCustomers = await Customer.find({ Status: true });
    const customerOrderCounts = {};

    // Count orders per customer
    [...posOrders, ...quickOrders].forEach(order => {
      if (order.Customer_id) {
        customerOrderCounts[order.Customer_id] = (customerOrderCounts[order.Customer_id] || 0) + 1;
      }
    });

    const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
    const newCustomers = customers.length;

    // Calculate totals
    const totalOrders = posOrders.length + quickOrders.length;
    const totalSales = [...posOrders, ...quickOrders].reduce((sum, order) => sum + (order.Total || 0), 0);
    const totalTax = [...posOrders, ...quickOrders].reduce((sum, order) => sum + (order.Tax || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get top sellers and payment breakdown
    const topSellers = await getTopSellers(dateRange);
    const paymentBreakdown = await getPaymentBreakdown(dateRange);

    const report = {
      period: 'Last Six Months',
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      topSellers,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalCustomers: allCustomers.length,
      newCustomers,
      repeatCustomers,
      netSales: totalSales,
      tax: totalTax,
      payment: paymentBreakdown
    };

    res.status(200).json({
      success: true,
      message: 'Six months report generated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error generating six months report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating six months report',
      error: error.message
    });
  }
};

// Reports One Year
const reportsOneYear = async (req, res) => {
  try {
    const dateRange = getDateRange('one_year');
    
    // Get orders in date range
    const posOrders = await Pos_Point_sales_Order.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    const quickOrders = await Quick_Order.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    // Get customers in date range
    const customers = await Customer.find({
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true
    });

    // Get all customers for repeat customer calculation
    const allCustomers = await Customer.find({ Status: true });
    const customerOrderCounts = {};

    // Count orders per customer
    [...posOrders, ...quickOrders].forEach(order => {
      if (order.Customer_id) {
        customerOrderCounts[order.Customer_id] = (customerOrderCounts[order.Customer_id] || 0) + 1;
      }
    });

    const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
    const newCustomers = customers.length;

    // Calculate totals
    const totalOrders = posOrders.length + quickOrders.length;
    const totalSales = [...posOrders, ...quickOrders].reduce((sum, order) => sum + (order.Total || 0), 0);
    const totalTax = [...posOrders, ...quickOrders].reduce((sum, order) => sum + (order.Tax || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get top sellers and payment breakdown
    const topSellers = await getTopSellers(dateRange);
    const paymentBreakdown = await getPaymentBreakdown(dateRange);

    const report = {
      period: 'Last One Year',
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      topSellers,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalCustomers: allCustomers.length,
      newCustomers,
      repeatCustomers,
      netSales: totalSales,
      tax: totalTax,
      payment: paymentBreakdown
    };

    res.status(200).json({
      success: true,
      message: 'One year report generated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error generating one year report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating one year report',
      error: error.message
    });
  }
};

// Restaurant Performance API
const restaurantPerformance = async (req, res) => {
  try {
    // Get restaurant ID from route parameter
    const { id } = req.params;
    const parsedRestaurantId = parseInt(id);

    if (!id || isNaN(parsedRestaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid restaurant ID is required'
      });
    }

    // Verify restaurant user exists and has restaurant role
    const restaurantUser = await User.findOne({ user_id: parsedRestaurantId });
    
    if (!restaurantUser) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const restaurantRole = await Role.findOne({ Role_id: restaurantUser.Role_id });
    if (!restaurantRole || restaurantRole.role_name?.toLowerCase() !== 'restaurant') {
      return res.status(400).json({
        success: false,
        message: 'Provided user is not associated with a restaurant role'
      });
    }

    // Get all employees created by this restaurant
    const employees = await User.find({ 
      CreateBy: parsedRestaurantId, 
      Status: true 
    });
    const employeeIds = employees.map(emp => emp.user_id);

    // Get orders filtered by restaurant
    const posOrderQuery = { 
      Restaurant_id: parsedRestaurantId,
      Status: true 
    };
    
    const quickOrderQuery = { 
      Status: true 
    };
    
    if (employeeIds.length > 0) {
      quickOrderQuery['get_order_Employee_id'] = { $in: employeeIds };
    } else {
      // If no employees found, return empty result for Quick Orders
      quickOrderQuery['get_order_Employee_id'] = { $in: [-1] };
    }

    const [posOrders, quickOrders] = await Promise.all([
      Pos_Point_sales_Order.find(posOrderQuery),
      Quick_Order.find(quickOrderQuery)
    ]);

    // Calculate TotalSalesCount (total revenue)
    const totalSalesCount = [...posOrders, ...quickOrders].reduce(
      (sum, order) => sum + (order.Total || 0), 
      0
    );

    // Calculate TotalOrderCount
    const totalOrderCount = posOrders.length + quickOrders.length;

    // Get TotalActiveClientsCount - filter clients created by restaurant or its employees
    const clientCreators = [parsedRestaurantId, ...employeeIds];
    const totalActiveClientsCount = await Clients.countDocuments({ 
      CreateBy: { $in: clientCreators },
      Status: true 
    });

    // Get customers - filter by restaurant employees
    const customerFilter = { 
      Status: true 
    };
    if (employeeIds.length > 0) {
      customerFilter.CreateBy = { $in: employeeIds };
    }
    const allCustomers = await Customer.find(customerFilter);

    // Calculate new customers (customers created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newCustomerFilter = {
      CreateAt: { $gte: thirtyDaysAgo },
      Status: true
    };
    if (employeeIds.length > 0) {
      newCustomerFilter.CreateBy = { $in: employeeIds };
    }
    
    const newCustomers = await Customer.countDocuments(newCustomerFilter);

    // Calculate repeat customers (customers with more than 1 order)
    const customerOrderCounts = {};
    
    // Count orders per customer from POS orders
    posOrders.forEach(order => {
      if (order.Customer_id) {
        customerOrderCounts[order.Customer_id] = (customerOrderCounts[order.Customer_id] || 0) + 1;
      }
    });

    // Count orders per customer from Quick orders by matching phone to Customer_id
    quickOrders.forEach(order => {
      if (order.client_mobile_no) {
        // Try to match Quick Order phone with Customer record
        const customer = allCustomers.find(c => c.phone === order.client_mobile_no);
        if (customer) {
          customerOrderCounts[customer.Customer_id] = (customerOrderCounts[customer.Customer_id] || 0) + 1;
        }
      }
    });

    // Count repeat customers (customers with more than 1 order)
    const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;

    // Calculate Average Order Value
    const avgOrderValue = totalOrderCount > 0 
      ? parseFloat((totalSalesCount / totalOrderCount).toFixed(2))
      : 0;

    // Prepare response
    const performanceData = {
      TotalSalesCount: totalSalesCount,
      TotalOrderCount: totalOrderCount,
      TotalActiveClientsCount: totalActiveClientsCount,
      getNewCustomers: newCustomers,
      getRepeatCustomers: repeatCustomers,
      getAvgOrderValue: avgOrderValue,
      Chart: null,
      Restaurant: {
        Restaurant_id: restaurantUser.user_id,
        Name: restaurantUser.Name,
        email: restaurantUser.email
      }
    };

    res.status(200).json({
      success: true,
      message: 'Restaurant performance data retrieved successfully',
      data: performanceData
    });
  } catch (error) {
    console.error('Error fetching restaurant performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant performance data',
      error: error.message
    });
  }
};

module.exports = {
  reportsToday,
  reportsMonth,
  reportsSixMonth,
  reportsOneYear,
  restaurantPerformance
};
