const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const storeDetailsSchema = new mongoose.Schema({
  Store_id: {
    type: Number,
    unique: true,
    auto: true
  },
  Store_img: {
    type: String,
    default: null
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
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

// Auto-increment for Store_id
storeDetailsSchema.plugin(AutoIncrement, { inc_field: 'Store_id' });

module.exports = mongoose.model('Store_details', storeDetailsSchema);
