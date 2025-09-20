const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const posPointSalesOrderSchema = new mongoose.Schema({
  POS_Order_id: {
    type: Number,
    unique: true,
    auto: true
  },
  items: [{
    item_id: { type: Number, ref: 'Items', required: true },
    item_Quentry: { type: Number, required: true, min: 1 },
    item_Addons_id: { type: Number, ref: 'item_Addons' },
    item_Variants_id: { type: Number, ref: 'item_Variants' }
  }],
  Tax: {
    type: Number,
    required: true,
    min: 0
  },
  SubTotal: {
    type: Number,
    required: true,
    min: 0
  },
  Total: {
    type: Number,
    required: true,
    min: 0
  },
  Customer_id: {
    type: Number,
    ref: 'Customer'
  },
  Dining_Option: {
    type: String,
    enum: ['Dine in', 'Delivery', 'Take Away'],
    default: 'Dine in'
  },
  Table_id: {
    type: Number,
    ref: 'Table'
  },
  Kitchen_id: {
    type: Number,
    ref: 'Kitchen'
  },
  Status: {
    type: Boolean,
    default: true
  },
  CreateBy: {
    type: Number,
    ref: 'User',
    required: true
  },
  CreateAt: {
    type: Date,
    default: Date.now
  },
  UpdatedBy: {
    type: Number,
    ref: 'User'
  },
  UpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  versionKey: false
});

// Auto-increment for POS_Order_id
posPointSalesOrderSchema.plugin(AutoIncrement, { inc_field: 'POS_Order_id' });

module.exports = mongoose.model('Pos_Point_sales_Order', posPointSalesOrderSchema);
