const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  applicantName: {
    type: String,
    trim: true,
    default: 'SC Beneficiary Applicant'
  },
  phone: {
    type: String,
    trim: true
  },
  isSC: {
    type: Boolean,
    default: true
  },
  gender: {
    type: String,
    enum: ['female', 'male', 'other'],
    default: 'female'
  },
  annualFamilyIncome: {
    type: Number,
    required: true
  },
  projectType: {
    type: String,
    default: 'small_business'
  },
  projectCost: {
    type: Number,
    required: true
  },
  isEducation: {
    type: Boolean,
    default: false
  },
  city: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Applicant', applicantSchema);
