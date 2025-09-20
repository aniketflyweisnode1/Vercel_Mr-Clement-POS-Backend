const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const itemsSchema = new mongoose.Schema({
  Items_id: {
    type: Number,
    unique: true,
    auto: true
  },
  Items_types_id: {
    type: Number,
    ref: 'Items_types',
    required: true
  },
  Emozi: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  'item-name': {
    type: String,
    required: true,
    trim: true
  },
  'item-code': {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  'item-size': {
    type: String,
    default: null
  },
  'item-price': {
    type: Number,
    required: true,
    min: 0
  },
  'item-quantity': {
    type: Number,
    required: true,
    min: 0
  },
  'item-stock-quantity': {
    type: Number,
    required: true,
    min: 0
  },
  Details: {
    type: String,
    default: null
  },
  Status: {
    type: Boolean,
    default: true
  },
  CreateBy: {
    type: Number,
    ref: 'User'
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

// Auto-increment for Items_id
itemsSchema.plugin(AutoIncrement, { inc_field: 'Items_id' });

module.exports = mongoose.model('Items', itemsSchema);
