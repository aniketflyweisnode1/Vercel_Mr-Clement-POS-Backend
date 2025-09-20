const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const tableSchema = new mongoose.Schema({
  Table_id: {
    type: Number,
    unique: true,
    auto: true
  },
  Table_types_id: {
    type: Number,
    ref: 'Table_types',
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
  'Table-name': {
    type: String,
    required: true,
    trim: true
  },
  'Table-code': {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  'Table-booking-price': {
    type: Number,
    required: true,
    min: 0
  },
  'Table-Booking-Status_id': {
    type: Number,
    ref: 'Table-Booking-Status',
    required: true,
    default: 1
  },
  'Seating-Persons_Count': {
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

// Auto-increment for Table_id
tableSchema.plugin(AutoIncrement, { inc_field: 'Table_id' });

module.exports = mongoose.model('Table', tableSchema);
