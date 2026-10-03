const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  schemeName: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  nameHi: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  descriptionHi: {
    type: String
  },
  eligibility: {
    type: String, // plain-language eligibility summary
    required: true
  },
  incomeLimit: {
    type: Number, // ₹5,00,000 (effective Jan 7, 2026 per NSFDC FAQ)
    default: 500000
  },
  maxIncomeLimit: {
    type: Number,
    default: 500000
  },
  maxProjectCost: {
    type: Number,
    required: true
  },
  maxLoanAmount: {
    type: Number,
    required: true
  },
  minLoanAmount: {
    type: Number,
    default: 10000
  },
  interestRate: {
    type: Number,
    required: true
  },
  repaymentPeriodMonths: {
    type: Number,
    default: 60
  },
  tenureMonthsMax: {
    type: Number,
    default: 60
  },
  moratoriumMonths: {
    type: Number,
    default: 0
  },
  eligibleActivities: [{
    type: String
  }],
  applicableFor: [{
    type: String
  }],
  requiredDocuments: [{
    type: String
  }],
  documentsRequired: [{
    type: String
  }],
  channelizingAgencies: [{
    type: String // agency types: "SCA", "PSB", "RRB", "NBFC-MFI"
  }],
  genderSpecific: {
    type: String, // "any" | "women"
    default: "any"
  },
  category: {
    type: String, // "business" | "education" | "green" | "micro"
    default: "business"
  },
  educationRequired: {
    type: Boolean,
    default: false
  },
  costCoveragePercent: {
    type: Number,
    default: 90
  },
  subsidyDetails: {
    type: String
  },
  sourceUrl: {
    type: String, // official NSFDC page verified against
    required: true
  },
  lastVerified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to ensure schemeName and name sync
schemeSchema.pre('save', function (next) {
  if (!this.schemeName && this.name) {
    this.schemeName = this.name;
  }
  if (!this.name && this.schemeName) {
    this.name = this.schemeName;
  }
  if (!this.purpose && this.description) {
    this.purpose = this.description;
  }
  if (!this.description && this.purpose) {
    this.description = this.purpose;
  }
  if ((!this.requiredDocuments || this.requiredDocuments.length === 0) && this.documentsRequired) {
    this.requiredDocuments = this.documentsRequired;
  }
  if ((!this.documentsRequired || this.documentsRequired.length === 0) && this.requiredDocuments) {
    this.documentsRequired = this.requiredDocuments;
  }
  next();
});

module.exports = mongoose.model('Scheme', schemeSchema);
