const Pos_Point_sales_Order = require('../models/Pos_Point_sales_Order.model');
const Quick_Order = require('../models/Quick_Order.model');
const Customer = require('../models/Customer.model');
const Items = require('../models/Items.model');
const Tokens = require('../models/Tokens.model');
const Invoices = require('../models/Invoices.model');

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

module.exports = {
  reportsToday,
  reportsMonth,
  reportsSixMonth,
  reportsOneYear
};
