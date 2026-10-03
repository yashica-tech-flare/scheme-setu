const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  referenceId: {
    type: String,
    unique: true
  },
  applicantName: {
    type: String,
    default: 'SC Beneficiary Applicant'
  },
  phone: {
    type: String
  },
  income: {
    type: Number,
    required: true
  },
  projectType: {
    type: String,
    required: true
  },
  projectCost: {
    type: Number,
    required: true
  },
  isEducation: {
    type: Boolean,
    default: false
  },
  matchedScheme: {
    type: String,
    required: true
  },
  routedPartner: {
    type: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Inquiry_Sent', 'Documents_Pending', 'Approved'],
    default: 'Draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', applicationSchema);
