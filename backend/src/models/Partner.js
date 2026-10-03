const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['SCA', 'PSB', 'RRB', 'NBFC-MFI']
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  schemesHandled: [{
    type: String
  }],
  npaStatus: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  fundUtilizationPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  contact: {
    type: String,
    required: true
  },
  email: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Partner', partnerSchema);
