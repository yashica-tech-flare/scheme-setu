const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    default: ''
  },
  actor: {
    type: String,
    enum: ['applicant', 'partner', 'system'],
    default: 'applicant'
  },
  isPartnerConfirmed: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  // Unique SETU-XXXX-XXXX reference identifier
  refId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Backwards-compatible alias for existing records
  referenceId: {
    type: String,
    index: true
  },

  // Structured applicant profile
  applicantProfile: {
    income: { type: Number, required: true },
    projectType: { type: String, default: 'General Business' },
    projectCost: { type: Number, required: true },
    gender: { type: String, default: 'female' },
    isSC: { type: Boolean, default: true },
    isEducation: { type: Boolean, default: false }
  },

  // Matched scheme details captured at inquiry time
  matchedScheme: {
    schemeId: { type: String },
    schemeName: { type: String, required: true },
    matchScore: { type: Number, default: 95 },
    interestRate: { type: Number },
    maxLoanAmount: { type: Number },
    moratoriumMonths: { type: Number }
  },

  // Routed channel partner details
  routedPartner: {
    partnerId: { type: String },
    partnerName: { type: String, default: 'Pending Selection' },
    partnerType: { type: String, default: 'SCA' },
    distanceKm: { type: Number, default: null },
    contact: { type: String, default: '' },
    address: { type: String, default: '' }
  },

  // Lifecycle status
  status: {
    type: String,
    enum: [
      'inquiry_submitted',
      'documents_pending',
      'submitted_to_partner',
      'under_appraisal',
      'sanctioned',
      'disbursed',
      'rejected',
      'withdrawn',
      // Legacy fallback values for migration
      'Draft',
      'Inquiry_Sent',
      'Documents_Pending',
      'Approved'
    ],
    default: 'inquiry_submitted'
  },

  // Append-only audit trail
  statusHistory: [statusHistorySchema],

  // Which checklist items the applicant has marked complete
  documentsSubmitted: {
    type: [String],
    default: []
  },

  // Optional contact details provided by applicant
  contactInfo: {
    applicantName: { type: String, default: 'SC Beneficiary Applicant' },
    phone: { type: String, default: '' },
    preferredLanguage: { type: String, default: 'en' }
  },

  // Flat legacy compatibility fields
  applicantName: { type: String, default: 'SC Beneficiary Applicant' },
  phone: { type: String, default: '' },
  income: { type: Number },
  projectType: { type: String },
  projectCost: { type: Number },
  isEducation: { type: Boolean, default: false },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to keep refId and referenceId in sync
applicationSchema.pre('save', function (next) {
  if (this.refId && !this.referenceId) {
    this.referenceId = this.refId;
  } else if (this.referenceId && !this.refId) {
    this.refId = this.referenceId;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
