const support_ticket = require('../models/support_ticket.model');
const User = require('../models/User.model');
const Customer = require('../models/Customer.model');
const support_ticket_type = require('../models/support_ticket_type.model');

// Create support ticket
const createSupportTicket = async (req, res) => {
  try {
    const { support_ticket_type_id, question, customer_id, Ticket_status, Status } = req.body;
    const userId = req.user.user_id;

    const supportTicket = new support_ticket({
      support_ticket_type_id,
      question,
      customer_id,
      Ticket_status,
      Status,
      CreateBy: userId
    });

    const savedSupportTicket = await supportTicket.save();
    
    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: savedSupportTicket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating support ticket',
      error: error.message
    });
  }
};

// Update support ticket
const updateSupportTicket = async (req, res) => {
  try {
    const { id, support_ticket_type_id, question, customer_id, Ticket_status, Status } = req.body;
    const userId = req.user.user_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Support ticket ID is required in request body'
      });
    }

    const supportTicket = await support_ticket.findOne({ support_ticket_id: parseInt(id) });
    if (!supportTicket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    if (support_ticket_type_id !== undefined) supportTicket.support_ticket_type_id = support_ticket_type_id;
    if (question !== undefined) supportTicket.question = question;
    if (customer_id !== undefined) supportTicket.customer_id = customer_id;
    if (Ticket_status !== undefined) supportTicket.Ticket_status = Ticket_status;
    if (Status !== undefined) supportTicket.Status = Status;
    
    supportTicket.UpdatedBy = userId;
    supportTicket.UpdatedAt = new Date();

    const updatedSupportTicket = await supportTicket.save();
    
    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: updatedSupportTicket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating support ticket',
      error: error.message
    });
  }
};

// Get support ticket by ID
const getSupportTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supportTicket = await support_ticket.findOne({ support_ticket_id: parseInt(id) });
    
    if (!supportTicket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Manually fetch related data
    const [createByUser, updatedByUser, customer, ticketType] = await Promise.all([
      supportTicket.CreateBy ? User.findOne({ user_id: supportTicket.CreateBy }) : null,
      supportTicket.UpdatedBy ? User.findOne({ user_id: supportTicket.UpdatedBy }) : null,
      supportTicket.customer_id ? Customer.findOne({ Customer_id: supportTicket.customer_id }) : null,
      supportTicket.support_ticket_type_id ? support_ticket_type.findOne({ support_ticket_id: supportTicket.support_ticket_type_id }) : null
    ]);

    // Create response object with populated data
    const supportTicketResponse = supportTicket.toObject();
    supportTicketResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
    supportTicketResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
    supportTicketResponse.Customer = customer ? { Customer_id: customer.Customer_id, Name: customer.Name, phone: customer.phone } : null;
    supportTicketResponse.SupportTicketType = ticketType ? { support_ticket_id: ticketType.support_ticket_id, Name: ticketType.Name } : null;

    res.status(200).json({
      success: true,
      data: supportTicketResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching support ticket',
      error: error.message
    });
  }
};

// Get all support tickets
const getAllSupportTickets = async (req, res) => {
  try {
    const supportTickets = await support_ticket.find()
      .sort({ CreateAt: -1 });

    // Manually fetch related data for all support tickets
    const supportTicketsWithPopulatedData = await Promise.all(
      supportTickets.map(async (supportTicket) => {
        const [createByUser, updatedByUser, customer, ticketType] = await Promise.all([
          supportTicket.CreateBy ? User.findOne({ user_id: supportTicket.CreateBy }) : null,
          supportTicket.UpdatedBy ? User.findOne({ user_id: supportTicket.UpdatedBy }) : null,
          supportTicket.customer_id ? Customer.findOne({ Customer_id: supportTicket.customer_id }) : null,
          supportTicket.support_ticket_type_id ? support_ticket_type.findOne({ support_ticket_id: supportTicket.support_ticket_type_id }) : null
        ]);

        const supportTicketResponse = supportTicket.toObject();
        supportTicketResponse.CreateBy = createByUser ? { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
        supportTicketResponse.UpdatedBy = updatedByUser ? { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;
        supportTicketResponse.Customer = customer ? { Customer_id: customer.Customer_id, Name: customer.Name, phone: customer.phone } : null;
        supportTicketResponse.SupportTicketType = ticketType ? { support_ticket_id: ticketType.support_ticket_id, Name: ticketType.Name } : null;

        return supportTicketResponse;
      })
    );

    res.status(200).json({
      success: true,
      count: supportTicketsWithPopulatedData.length,
      data: supportTicketsWithPopulatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching support tickets',
      error: error.message
    });
  }
};

// Delete support ticket
const deleteSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supportTicket = await support_ticket.findOne({ support_ticket_id: parseInt(id) });
    
    if (!supportTicket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    await support_ticket.deleteOne({ support_ticket_id: parseInt(id) });
    
    res.status(200).json({
      success: true,
      message: 'Support ticket deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting support ticket',
      error: error.message
    });
  }
};

// Get Support Ticket by Auth (current logged in user)
const getSupportTicketByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const supportTickets = await support_ticket.find({ CreateBy: userId, Status: true }).sort({ CreateAt: -1 });
    
    if (!supportTickets || supportTickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Support tickets not found for current user'
      });
    }

    // Manually fetch related data for all support tickets
    const supportTicketsResponse = await Promise.all(supportTickets.map(async (supportTicket) => {
      const [createByUser, updatedByUser] = await Promise.all([
        supportTicket.CreateBy ? User.findOne({ user_id: supportTicket.CreateBy }) : null,
        supportTicket.UpdatedBy ? User.findOne({ user_id: supportTicket.UpdatedBy }) : null
      ]);

      const supportTicketObj = supportTicket.toObject();
      supportTicketObj.CreateBy = createByUser ? 
        { user_id: createByUser.user_id, Name: createByUser.Name, email: createByUser.email } : null;
      supportTicketObj.UpdatedBy = updatedByUser ? 
        { user_id: updatedByUser.user_id, Name: updatedByUser.Name, email: updatedByUser.email } : null;

      return supportTicketObj;
    }));

    res.status(200).json({
      success: true,
      count: supportTicketsResponse.length,
      data: supportTicketsResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching support tickets',
      error: error.message
    });
  }
};

module.exports = {
  createSupportTicket,
  updateSupportTicket,
  getSupportTicketById,
  getAllSupportTickets,
  getSupportTicketByAuth,
  deleteSupportTicket
};
