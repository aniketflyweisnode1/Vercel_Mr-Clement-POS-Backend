const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const planMapClientSchema = new mongoose.Schema({
  Plan_map_Client_id: {
    type: Number,
    unique: true,
    auto: true
  },
  client_id: {
    type: Number,
    ref: 'Clients',
    required: true
  },
  plan_id: {
    type: Number,
    ref: 'Plan',
    required: true
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

// Auto-increment for Plan_map_Client_id
planMapClientSchema.plugin(AutoIncrement, { inc_field: 'Plan_map_Client_id' });

module.exports = mongoose.model('Plan_map_Client', planMapClientSchema);
