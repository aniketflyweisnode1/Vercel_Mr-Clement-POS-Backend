const Pos_Point_sales_Order = require('../models/Pos_Point_sales_Order.model');
const Quick_Order = require('../models/Quick_Order.model');
const Customer = require('../models/Customer.model');
const Items = require('../models/Items.model');
const Tokens = require('../models/Tokens.model');
const Invoices = require('../models/Invoices.model');
const Clients = require('../models/Clients.model');
const User = require('../models/User.model');
const Role = require('../models/Role.model');
const Admin_Plan_buy_Restaurant = require('../models/Admin_Plan_buy_Restaurant.model');
const Admin_Plan = require('../models/Admin_Plan.model');
const City = require('../models/City.model');
const Clock = require('../models/Clock.model');
const Reservations = require('../models/Reservations.model');
const Table = require('../models/Table.model');

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

// Helper function to get date range for restaurant performance
const getRestaurantPerformanceDateRange = (filter) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'Day':
    case 'day':
      return {
        start: startOfDay,
        end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'Week':
    case 'week':
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - dayOfWeek);
      return {
        start: startOfWeek,
        end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
      };
    case 'Month':
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      };
    case '6 Month':
    case '6month':
    case '6Month':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 6, 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      };
    default:
      return {
        start: startOfDay,
        end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
      };
  }
};

// Restaurant Performance API with filters and chart
const restaurant_performoance = async (req, res) => {
  try {
    const { filter = 'Day' } = req.query; // filter: Day, Week, Month, 6 Month
    const { id } = req.params; // restaurant ID
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

    // Get date range based on filter
    const dateRange = getRestaurantPerformanceDateRange(filter);

    // Get all employees created by this restaurant
    const employees = await User.find({ 
      CreateBy: parsedRestaurantId, 
      Status: true 
    });
    const employeeIds = employees.map(emp => emp.user_id);

    // Get orders filtered by restaurant and date range
    const posOrderQuery = { 
      Restaurant_id: parsedRestaurantId,
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true 
    };
    
    const quickOrderQuery = { 
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true 
    };
    
    if (employeeIds.length > 0) {
      quickOrderQuery['get_order_Employee_id'] = { $in: employeeIds };
    } else {
      quickOrderQuery['get_order_Employee_id'] = { $in: [-1] };
    }

    const [posOrders, quickOrders] = await Promise.all([
      Pos_Point_sales_Order.find(posOrderQuery),
      Quick_Order.find(quickOrderQuery)
    ]);

    // Calculate TotalSales (total revenue)
    const totalSales = [...posOrders, ...quickOrders].reduce(
      (sum, order) => sum + (order.Total || 0), 
      0
    );

    // Calculate TotalOrders
    const totalOrders = posOrders.length + quickOrders.length;

    // Get TotalActiveRestourentClient - filter clients created by restaurant or its employees within date range
    const clientCreators = [parsedRestaurantId, ...employeeIds];
    const totalActiveRestourentClient = await Clients.countDocuments({ 
      CreateBy: { $in: clientCreators },
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true 
    });

    // Get customers - filter by restaurant employees and date range
    const customerFilter = { 
      CreateAt: { $gte: dateRange.start, $lt: dateRange.end },
      Status: true 
    };
    if (employeeIds.length > 0) {
      customerFilter.CreateBy = { $in: employeeIds };
    }
    const allCustomers = await Customer.find(customerFilter);

    // Calculate new customers (customers created in the date range)
    const newCustomers = allCustomers.length;

    // Calculate repeat customers (customers with more than 1 order in the date range)
    const customerOrderCounts = {};
    
    // Count orders per customer from POS orders
    posOrders.forEach(order => {
      if (order.Customer_id) {
        customerOrderCounts[order.Customer_id] = (customerOrderCounts[order.Customer_id] || 0) + 1;
      }
    });

    // Count orders per customer from Quick orders
    quickOrders.forEach(order => {
      if (order.client_mobile_no) {
        const customer = allCustomers.find(c => c.phone === order.client_mobile_no);
        if (customer) {
          customerOrderCounts[customer.Customer_id] = (customerOrderCounts[customer.Customer_id] || 0) + 1;
        }
      }
    });

    // Count repeat customers (customers with more than 1 order)
    const repeactCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;

    // Calculate Average Order Value
    const avgOrderValue = totalOrders > 0 
      ? parseFloat((totalSales / totalOrders).toFixed(2))
      : 0;

    // Create Restaurant_performoance_chart with [Earning, Hour] format
    const Restaurant_performoance_chart = [];
    
    // Initialize earnings for each hour (0-23)
    const hourlyEarnings = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyEarnings[hour] = 0;
    }

    // Calculate earnings by hour from all orders
    [...posOrders, ...quickOrders].forEach(order => {
      if (order.CreateAt) {
        const orderDate = new Date(order.CreateAt);
        const hour = orderDate.getHours();
        hourlyEarnings[hour] = (hourlyEarnings[hour] || 0) + (order.Total || 0);
      }
    });

    // Format chart data as [Earning, Hour]
    for (let hour = 0; hour < 24; hour++) {
      Restaurant_performoance_chart.push({
        Hour: hour,
        Earning: parseFloat(hourlyEarnings[hour].toFixed(2))
      });
    }

    // Prepare response
    const performanceData = {
      TotalSales: parseFloat(totalSales.toFixed(2)),
      TotalOrders: totalOrders,
      TotalActiveRestourentClient: totalActiveRestourentClient,
      NewCustomers: newCustomers,
      repeactCustomers: repeactCustomers,
      AvgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      Restaurant_performoance_chart: Restaurant_performoance_chart,
      filter: filter,
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
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

// Restaurant Top Performers API
const restaurant_Top_Performer = async (req, res) => {
  try {
    // Get restaurant role
    const restaurantRole = await Role.findOne({ 
      role_name: { $regex: /^restaurant$/i } 
    });

    if (!restaurantRole) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant role not found'
      });
    }

    // Get all restaurant users
    const restaurantUsers = await User.find({
      Role_id: restaurantRole.Role_id,
      Status: true
    });

    if (restaurantUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No restaurants found',
        count: 0,
        data: []
      });
    }

    // Process each restaurant to calculate total sales and get renewal date
    const restaurantPerformers = await Promise.all(
      restaurantUsers.map(async (restaurant) => {
        const restaurantId = restaurant.user_id;

        // Get all employees created by this restaurant
        const employees = await User.find({
          CreateBy: restaurantId,
          Status: true
        });
        const employeeIds = employees.map(emp => emp.user_id);

        // Get POS orders for this restaurant
        const posOrders = await Pos_Point_sales_Order.find({
          Restaurant_id: restaurantId,
          Status: true
        });

        // Get Quick orders for this restaurant (via employees)
        let quickOrders = [];
        if (employeeIds.length > 0) {
          quickOrders = await Quick_Order.find({
            get_order_Employee_id: { $in: employeeIds },
            Status: true
          });
        }

        // Calculate total sales
        const totalSales = [...posOrders, ...quickOrders].reduce(
          (sum, order) => sum + (order.Total || 0),
          0
        );

        // Get renewal date from Admin_Plan_buy_Restaurant
        // Get the most recent active plan with successful payment
        const activePlan = await Admin_Plan_buy_Restaurant.findOne({
          CreateBy: restaurantId,
          isActive: true,
          paymentStatus: true,
          Status: true
        }).sort({ expiry_date: -1 });

        const renewalDate = activePlan?.expiry_date || null;

        return {
          restourent_id: restaurantId,
          totalesale: parseFloat(totalSales.toFixed(2)),
          renewaldate: renewalDate
        };
      })
    );

    // Sort by total sales descending (top performers first)
    restaurantPerformers.sort((a, b) => b.totalesale - a.totalesale);

    res.status(200).json({
      success: true,
      message: 'Restaurant top performers retrieved successfully',
      count: restaurantPerformers.length,
      data: restaurantPerformers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant top performers',
      error: error.message
    });
  }
};

// Reports API with Active/Inactive Restaurants and Charts
const reports = async (req, res) => {
  try {
    // Get restaurant role
    const restaurantRole = await Role.findOne({ 
      role_name: { $regex: /^restaurant$/i } 
    });

    if (!restaurantRole) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant role not found'
      });
    }

    // Get all restaurant users
    const restaurantUsers = await User.find({
      Role_id: restaurantRole.Role_id,
      Status: true
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate active and inactive restaurants
    let TotalActiverestaurant = 0;
    let TotalInacitverestaurant = 0;
    let totalRenewals = 0;

    const activeRestaurants = [];
    const inactiveRestaurants = [];

    for (const restaurant of restaurantUsers) {
      const activePlan = await Admin_Plan_buy_Restaurant.findOne({
        CreateBy: restaurant.user_id,
        isActive: true,
        paymentStatus: true,
        Status: true
      }).sort({ CreateAt: -1 });

      let isActive = false;
      if (activePlan && activePlan.expiry_date) {
        const expiryDate = new Date(activePlan.expiry_date);
        if (expiryDate > now) {
          isActive = true;
        }
      } else if (activePlan && !activePlan.expiry_date) {
        isActive = true; // No expiry means active
      }

      if (isActive) {
        TotalActiverestaurant++;
        activeRestaurants.push(restaurant.user_id);
      } else {
        TotalInacitverestaurant++;
        inactiveRestaurants.push(restaurant.user_id);
      }

      // Count renewals (plans with paymentStatus = true)
      const renewals = await Admin_Plan_buy_Restaurant.countDocuments({
        CreateBy: restaurant.user_id,
        paymentStatus: true,
        Status: true
      });
      if (renewals > 1) {
        totalRenewals += renewals - 1; // Subtract 1 for initial purchase
      }
    }

    const TotalRenewalRate = restaurantUsers.length > 0 
      ? parseFloat((totalRenewals / restaurantUsers.length).toFixed(2))
      : 0;

    // Helper function to calculate date ranges
    const getDateRange = (period) => {
      const start = new Date(today);
      const end = new Date(today);
      
      switch (period) {
        case 'week':
          start.setDate(today.getDate() - 7);
          break;
        case 'month':
          start.setMonth(today.getMonth() - 1);
          break;
        case 'halfYear':
          start.setMonth(today.getMonth() - 6);
          break;
        case 'year':
          start.setFullYear(today.getFullYear() - 1);
          break;
        default:
          start.setDate(today.getDate() - 7);
      }
      return { start, end };
    };

    // Helper function to calculate percentage change
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(2));
    };

    // Calculate active chart data
    const calculateActiveChart = async (period) => {
      const { start, end } = getDateRange(period);
      const previousStart = new Date(start);
      previousStart.setTime(previousStart.getTime() - (end - start));

      // Get new clients (restaurants created in period)
      const newClients = await User.countDocuments({
        Role_id: restaurantRole.Role_id,
        Status: true,
        CreateAt: { $gte: start, $lt: end }
      });

      // Get renewed clients (restaurants with plan purchases in period)
      const renewedClients = await Admin_Plan_buy_Restaurant.distinct('CreateBy', {
        paymentStatus: true,
        Status: true,
        CreateAt: { $gte: start, $lt: end }
      });

      // Previous period data
      const previousNewClients = await User.countDocuments({
        Role_id: restaurantRole.Role_id,
        Status: true,
        CreateAt: { $gte: previousStart, $lt: start }
      });

      const previousRenewedClients = await Admin_Plan_buy_Restaurant.distinct('CreateBy', {
        paymentStatus: true,
        Status: true,
        CreateAt: { $gte: previousStart, $lt: start }
      });

      const newClientsPercentage = calculatePercentageChange(newClients, previousNewClients);
      const renewedClientsPercentage = calculatePercentageChange(renewedClients.length, previousRenewedClients.length);

      return {
        newClients,
        renewedClients: renewedClients.length,
        percentageChange: parseFloat(((newClientsPercentage + renewedClientsPercentage) / 2).toFixed(2))
      };
    };

    // Calculate inactive chart data
    const calculateInactiveChart = async (period) => {
      const { start, end } = getDateRange(period);
      const previousStart = new Date(start);
      previousStart.setTime(previousStart.getTime() - (end - start));

      // Get inactive clients (restaurants with expired or no active plans)
      let inactiveClients = 0;
      const restaurantsInPeriod = await User.find({
        Role_id: restaurantRole.Role_id,
        Status: true,
        CreateAt: { $gte: start, $lt: end }
      });

      for (const restaurant of restaurantsInPeriod) {
        const activePlan = await Admin_Plan_buy_Restaurant.findOne({
          CreateBy: restaurant.user_id,
          isActive: true,
          paymentStatus: true,
          Status: true
        }).sort({ CreateAt: -1 });

        let isActive = false;
        if (activePlan && activePlan.expiry_date) {
          const expiryDate = new Date(activePlan.expiry_date);
          if (expiryDate > now) {
            isActive = true;
          }
        } else if (activePlan && !activePlan.expiry_date) {
          isActive = true;
        }

        if (!isActive) {
          inactiveClients++;
        }
      }

      // Previous period
      const previousRestaurants = await User.find({
        Role_id: restaurantRole.Role_id,
        Status: true,
        CreateAt: { $gte: previousStart, $lt: start }
      });

      let previousInactiveClients = 0;
      for (const restaurant of previousRestaurants) {
        const activePlan = await Admin_Plan_buy_Restaurant.findOne({
          CreateBy: restaurant.user_id,
          isActive: true,
          paymentStatus: true,
          Status: true
        }).sort({ CreateAt: -1 });

        let isActive = false;
        if (activePlan && activePlan.expiry_date) {
          const expiryDate = new Date(activePlan.expiry_date);
          if (expiryDate > now) {
            isActive = true;
          }
        } else if (activePlan && !activePlan.expiry_date) {
          isActive = true;
        }

        if (!isActive) {
          previousInactiveClients++;
        }
      }

      const percentageChange = calculatePercentageChange(inactiveClients, previousInactiveClients);

      return {
        inactiveClients,
        percentageChange
      };
    };

    // Generate chart data
    const [activeWeek, activeMonth, activeHalfYear, activeYear] = await Promise.all([
      calculateActiveChart('week'),
      calculateActiveChart('month'),
      calculateActiveChart('halfYear'),
      calculateActiveChart('year')
    ]);

    const [inactiveWeek, inactiveMonth, inactiveHalfYear, inactiveYear] = await Promise.all([
      calculateInactiveChart('week'),
      calculateInactiveChart('month'),
      calculateInactiveChart('halfYear'),
      calculateInactiveChart('year')
    ]);

    res.status(200).json({
      success: true,
      message: 'Reports retrieved successfully',
      reports: {
        TotalActiverestaurant,
        TotalInacitverestaurant,
        TotalRenewalRate
      },
      Chart: {
        active: {
          week: activeWeek,
          month: activeMonth,
          halfYear: activeHalfYear,
          year: activeYear
        },
        inactive: {
          week: inactiveWeek,
          month: inactiveMonth,
          halfYear: inactiveHalfYear,
          year: inactiveYear
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// City Wise Usage Report
const cityWiseUsageReport = async (req, res) => {
  try {
    // Get restaurant role
    const restaurantRole = await Role.findOne({ 
      role_name: { $regex: /^restaurant$/i } 
    });

    if (!restaurantRole) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant role not found'
      });
    }

    // Get all restaurant users (clients)
    const restaurantUsers = await User.find({
      Role_id: restaurantRole.Role_id,
      Status: true
    });

    // Group restaurants by city
    const cityRestaurantCount = {};
    restaurantUsers.forEach(restaurant => {
      const cityId = restaurant.City_id;
      if (!cityRestaurantCount[cityId]) {
        cityRestaurantCount[cityId] = 0;
      }
      cityRestaurantCount[cityId]++;
    });

    // Get city details
    const cityIds = Object.keys(cityRestaurantCount).map(id => parseInt(id));
    const cities = await City.find({
      City_id: { $in: cityIds },
      Status: true
    });

    const cityMap = cities.reduce((map, city) => {
      map[city.City_id] = city;
      return map;
    }, {});

    // Build response
    const cityWiseData = Object.entries(cityRestaurantCount).map(([cityId, count]) => {
      const city = cityMap[parseInt(cityId)];
      return {
        City_id: parseInt(cityId),
        City_name: city ? city.City_name : 'Unknown',
        City_code: city ? city.Code : null,
        restaurants_count: count
      };
    }).sort((a, b) => b.restaurants_count - a.restaurants_count);

    res.status(200).json({
      success: true,
      message: 'City wise usage report retrieved successfully',
      count: cityWiseData.length,
      data: cityWiseData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching city wise usage report',
      error: error.message
    });
  }
};

// Employee Performance API
const employeePerformance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const parsedEmployeeId = parseInt(employeeId);

    if (!employeeId || isNaN(parsedEmployeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid employee ID is required'
      });
    }

    // Verify employee exists
    const employee = await User.findOne({ user_id: parsedEmployeeId, Status: true });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get POS orders by employee (CreateBy)
    const posOrders = await Pos_Point_sales_Order.find({
      CreateBy: parsedEmployeeId,
      Status: true
    });

    // Get Quick orders by employee
    const quickOrders = await Quick_Order.find({
      get_order_Employee_id: parsedEmployeeId,
      Status: true
    });

    // Calculate totalSalesContributed
    const totalSalesContributed = [...posOrders, ...quickOrders].reduce(
      (sum, order) => sum + (order.Total || 0),
      0
    );

    // Calculate TotalOrdersTaken
    const TotalOrdersTaken = posOrders.length + quickOrders.length;

    // Calculate TotalTablesServed (unique tables from orders)
    const tableSet = new Set();
    posOrders.forEach(order => {
      if (order.Table_id) tableSet.add(order.Table_id);
    });
    quickOrders.forEach(order => {
      if (order.Table_id) tableSet.add(order.Table_id);
    });
    const TotalTablesServed = tableSet.size;

    // Calculate AvgWorkingHrs from Clock records
    const clockRecords = await Clock.find({
      user_id: parsedEmployeeId,
      Status: true,
      in_time: { $exists: true },
      out_time: { $exists: true }
    }).sort({ date: -1 });

    // Group by day and calculate average
    const dailyHours = [];
    const hoursByDay = {};

    clockRecords.forEach(record => {
      const day = new Date(record.date).toISOString().split('T')[0];
      if (!hoursByDay[day]) {
        hoursByDay[day] = [];
      }
      const inTime = new Date(record.in_time);
      const outTime = new Date(record.out_time);
      const hours = (outTime - inTime) / (1000 * 60 * 60);
      hoursByDay[day].push(hours);
    });

    Object.entries(hoursByDay).forEach(([day, hoursArray]) => {
      const totalHours = hoursArray.reduce((sum, h) => sum + h, 0);
      const avgHours = totalHours / hoursArray.length;
      dailyHours.push({
        day,
        hours: parseFloat(avgHours.toFixed(2))
      });
    });

    // Calculate total tips earned (assuming tips are in orders or separate model)
    // For now, we'll check if there's a tip field in orders
    let totalTipsEarned = 0;
    [...posOrders, ...quickOrders].forEach(order => {
      if (order.tip || order.Tip) {
        totalTipsEarned += parseFloat(order.tip || order.Tip || 0);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Employee performance retrieved successfully',
      data: {
        employee_id: parsedEmployeeId,
        employee_name: `${employee.Name} ${employee.last_name}`,
        totalSalesContributed: parseFloat(totalSalesContributed.toFixed(2)),
        TotalOrdersTaken,
        TotalTablesServed,
        AvgWorkingHrs: dailyHours,
        totalTipsEarned: parseFloat(totalTipsEarned.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee performance',
      error: error.message
    });
  }
};

// Restaurant Dashboard API
const restaurantDashboard = async (req, res) => {
  try {
    // Get restaurant ID from authenticated user or params
    const restaurantId = req.user?.user_id;
    
    if (!restaurantId || isNaN(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid restaurant ID is required'
      });
    }

    // Verify restaurant user exists and has restaurant role
    const restaurantUser = await User.findOne({ user_id: restaurantId });
    
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
      CreateBy: restaurantId, 
      Status: true 
    });
    const employeeIds = employees.map(emp => emp.user_id);

    // Get all orders for this restaurant
    const posOrderQuery = { 
      Restaurant_id: restaurantId,
      Status: true 
    };
    
    const quickOrderQuery = { 
      Status: true 
    };
    
    if (employeeIds.length > 0) {
      quickOrderQuery['get_order_Employee_id'] = { $in: employeeIds };
    } else {
      quickOrderQuery['get_order_Employee_id'] = { $in: [-1] };
    }

    const [posOrders, quickOrders, allCustomers] = await Promise.all([
      Pos_Point_sales_Order.find(posOrderQuery).sort({ CreateAt: -1 }),
      Quick_Order.find(quickOrderQuery).sort({ CreateAt: -1 }),
      employeeIds.length > 0 ? Customer.find({ CreateBy: { $in: employeeIds }, Status: true }) : []
    ]);

    // 1. TotalOrder
    const TotalOrder = posOrders.length + quickOrders.length;

    // 2. TotalSale
    const TotalSale = [...posOrders, ...quickOrders].reduce(
      (sum, order) => sum + (order.Total || 0),
      0
    );

    // Helper function to get day name from date (returns Mon-Sun)
    const getDayName = (date) => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()];
    };
    
    // Helper function to reorder days array to start with Monday
    const reorderDays = (data) => {
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return dayOrder.map(day => data[day] || 0);
    };

    // Helper function to initialize week data
    const initializeWeekData = () => {
      return {
        'Mon': 0,
        'Tue': 0,
        'Wed': 0,
        'Thu': 0,
        'Fri': 0,
        'Sat': 0,
        'Sun': 0
      };
    };

    // Get last 7 days for chart data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(new Date(date.setHours(0, 0, 0, 0)));
    }

    // 3. RepeatCustomersChart - customers with more than 1 order
    const repeatCustomersData = initializeWeekData();
    const customerOrderCounts = {};
    
    // Count orders per customer
    posOrders.forEach(order => {
      if (order.Customer_id) {
        customerOrderCounts[order.Customer_id] = (customerOrderCounts[order.Customer_id] || 0) + 1;
      }
    });

    quickOrders.forEach(order => {
      if (order.client_mobile_no) {
        const customer = allCustomers.find(c => c.phone === order.client_mobile_no);
        if (customer) {
          customerOrderCounts[customer.Customer_id] = (customerOrderCounts[customer.Customer_id] || 0) + 1;
        }
      }
    });

    // Get repeat customers (more than 1 order)
    const repeatCustomerIds = Object.keys(customerOrderCounts).filter(
      customerId => customerOrderCounts[customerId] > 1
    ).map(id => parseInt(id));

    // Count repeat customers by day of week in last 7 days
    const repeatCustomersByDay = {};
    last7Days.forEach(day => {
      const dayName = getDayName(day);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayPosOrders = posOrders.filter(order => {
        const orderDate = new Date(order.CreateAt);
        return orderDate >= day && orderDate < nextDay && repeatCustomerIds.includes(order.Customer_id);
      });
      
      const dayQuickOrders = quickOrders.filter(order => {
        const orderDate = new Date(order.CreateAt);
        if (orderDate >= day && orderDate < nextDay) {
          const customer = allCustomers.find(c => c.phone === order.client_mobile_no);
          return customer && repeatCustomerIds.includes(customer.Customer_id);
        }
        return false;
      });
      
      repeatCustomersByDay[dayName] = (dayPosOrders.length + dayQuickOrders.length);
    });

    // Calculate percentages for RepeatCustomersChart
    const repeatCustomersOrdered = reorderDays(repeatCustomersByDay);
    const maxRepeatCustomers = Math.max(...repeatCustomersOrdered, 1);
    const RepeatCustomersChart = {
      percentage: repeatCustomersOrdered.map(count => 
        Math.round((count / maxRepeatCustomers) * 100)
      ),
      Days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    };

    // 4. NewCustomersChart - first-time customers
    const newCustomersData = initializeWeekData();
    
    // Get customers created in last 7 days
    last7Days.forEach(day => {
      const dayName = getDayName(day);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const newCustomersCount = allCustomers.filter(customer => {
        const customerDate = new Date(customer.CreateAt);
        return customerDate >= day && customerDate < nextDay;
      }).length;
      
      newCustomersData[dayName] = newCustomersCount;
    });

    // Calculate percentages for NewCustomersChart
    const newCustomersOrdered = reorderDays(newCustomersData);
    const maxNewCustomers = Math.max(...newCustomersOrdered, 1);
    const NewCustomersChart = {
      percentage: newCustomersOrdered.map(count => 
        Math.round((count / maxNewCustomers) * 100)
      ),
      Days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    };

    // 5. ReservationsOrderList - Get recent reservations
    const reservationQuery = {
      Status: true
    };
    
    if (employeeIds.length > 0) {
      reservationQuery.CreateBy = { $in: employeeIds };
    } else {
      reservationQuery.CreateBy = { $in: [-1] };
    }
    
    const reservations = await Reservations.find(reservationQuery)
      .sort({ CreateAt: -1 })
      .limit(10);

    // Manually populate Customer and Table data
    const ReservationsOrderList = await Promise.all(reservations.map(async (reservation) => {
      const [customer, table] = await Promise.all([
        reservation.Customer_id ? Customer.findOne({ Customer_id: reservation.Customer_id }) : null,
        reservation.Table_id ? Table.findOne({ table_id: reservation.Table_id }) : null
      ]);

      return {
        Reservations_id: reservation.Reservations_id,
        Customer: customer ? {
          Customer_id: customer.Customer_id,
          Name: customer.Name,
          phone: customer.phone
        } : null,
        Table: table ? {
          Table_id: table.table_id,
          table_name: table.table_name
        } : null,
        slots: reservation.slots,
        slots_time: reservation.slots_time,
        Date_time: reservation.Date_time,
        people_count: reservation.people_count,
        PaymentStatus: reservation.PaymentStatus,
        Status: reservation.Status,
        CreateAt: reservation.CreateAt
      };
    }));

    // 6. TopSellersItemList - Top selling items
    const itemCounts = {};
    
    // Process POS orders
    posOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.item_id) {
            itemCounts[item.item_id] = (itemCounts[item.item_id] || 0) + (item.item_Quentry || 0);
          }
        });
      }
    });

    // Process Quick orders
    quickOrders.forEach(order => {
      if (order.item_ids && Array.isArray(order.item_ids)) {
        order.item_ids.forEach(item => {
          if (item.item_id) {
            itemCounts[item.item_id] = (itemCounts[item.item_id] || 0) + (item.quantity || 0);
          }
        });
      }
    });

    // Get top 10 items
    const topItemIds = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([itemId]) => parseInt(itemId));

    const topItems = await Items.find({ Items_id: { $in: topItemIds }, Status: true });
    
    const TopSellersItemList = topItemIds.map(itemId => {
      const item = topItems.find(i => i.Items_id === itemId);
      return {
        Items_id: itemId,
        item_name: item ? item['item-name'] : 'Unknown',
        item_code: item ? item['item-code'] : null,
        total_quantity_sold: itemCounts[itemId],
        item_price: item ? item['item-price'] : 0,
        item_stock_quantity: item ? item['item-stock-quantity'] : 0
      };
    });

    // 7. StockAlertList - Items with low stock (less than 10 or threshold)
    const stockThreshold = 10; // You can make this configurable
    const lowStockItems = await Items.find({
      'item-stock-quantity': { $lt: stockThreshold },
      Status: true
    })
    .sort({ 'item-stock-quantity': 1 })
    .limit(20);

    const StockAlertList = lowStockItems.map(item => ({
      Items_id: item.Items_id,
      item_name: item['item-name'],
      item_code: item['item-code'],
      item_stock_quantity: item['item-stock-quantity'],
      item_price: item['item-price'],
      alert_level: item['item-stock-quantity'] < 5 ? 'Critical' : 'Low'
    }));

    // Prepare response
    const dashboardData = {
      TotalOrder,
      RepeatCustomersChart,
      NewCustomersChart,
      TotalSale: parseFloat(TotalSale.toFixed(2)),
      ReservationsOrderList,
      TopSellersItemList,
      StockAlertList
    };

    res.status(200).json({
      success: true,
      message: 'Restaurant dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant dashboard data',
      error: error.message
    });
  }
};

module.exports = {
  reportsToday,
  reportsMonth,
  reportsSixMonth,
  reportsOneYear,
  restaurantPerformance,
  restaurant_performoance,
  restaurant_Top_Performer,
  reports,
  cityWiseUsageReport,
  employeePerformance,
  restaurantDashboard
};
