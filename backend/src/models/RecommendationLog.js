const mongoose = require('mongoose');

const recommendationLogSchema = new mongoose.Schema({
  queryInput: {
    income: Number,
    projectCost: Number,
    projectType: String,
    isEducation: Boolean,
    gender: String
  },
  recommendedSchemes: [{
    schemeName: String,
    matchScore: Number,
    matchReasons: [String],
    sourceUrl: String
  }],
  matchedCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RecommendationLog', recommendationLogSchema);
