const express = require('express');
const router = express.Router();
const { SchemeModel: Scheme } = require('../models/dbAdapter');
const RecommendationLog = require('../models/RecommendationLog');
const { recommendScheme } = require('../services/ruleEngine');

/**
 * POST /api/recommend
 * Body: { income, projectType, projectCost, isEducation, gender }
 * Returns: Array of recommended schemes with match scores, match reasons, and source provenance
 */
router.post('/', async (req, res) => {
  try {
    const { income, projectType, projectCost, isEducation, gender } = req.body;

    if (income === undefined || projectCost === undefined) {
      return res.status(400).json({
        error: 'Both income and projectCost are required fields'
      });
    }

    const numIncome = Number(income);
    const numCost = Number(projectCost);

    if (numIncome > 500000) {
      return res.status(200).json({
        eligible: false,
        message: 'Family income exceeds ₹5,00,000 threshold for NSFDC/NBCFDC concessional lending schemes.',
        schemes: []
      });
    }

    // Fetch all active schemes from the database/seed store
    const schemes = await Scheme.find({});

    const recommended = recommendScheme(
      {
        income: numIncome,
        projectCost: numCost,
        projectType: projectType || 'small_business',
        isEducation: Boolean(isEducation),
        gender: gender || 'female'
      },
      schemes
    );

    // Format output matching updated API contract with NSFDC Knowledge Base fields
    const formatted = recommended.map(s => ({
      _id: s._id,
      schemeName: s.schemeName || s.name,
      name: s.schemeName || s.name,
      nameHi: s.nameHi || s.schemeName || s.name,
      purpose: s.purpose || s.description,
      description: s.purpose || s.description,
      descriptionHi: s.descriptionHi,
      eligibility: s.eligibility,
      incomeLimit: s.incomeLimit || s.maxIncomeLimit || 500000,
      maxIncomeLimit: s.incomeLimit || s.maxIncomeLimit || 500000,
      maxProjectCost: s.maxProjectCost || s.maxLoanAmount,
      maxLoanAmount: s.maxLoanAmount,
      minLoanAmount: s.minLoanAmount,
      interestRate: s.interestRate,
      repaymentPeriodMonths: s.repaymentPeriodMonths || s.tenureMonthsMax || 60,
      tenureMonthsMax: s.repaymentPeriodMonths || s.tenureMonthsMax || 60,
      moratoriumMonths: s.moratoriumMonths || 0,
      eligibleActivities: s.eligibleActivities || s.applicableFor || [],
      applicableFor: s.applicableFor || s.eligibleActivities || [],
      requiredDocuments: s.requiredDocuments || s.documentsRequired || [],
      documentsRequired: s.requiredDocuments || s.documentsRequired || [],
      channelizingAgencies: s.channelizingAgencies || [],
      genderSpecific: s.genderSpecific || 'any',
      category: s.category || 'business',
      educationRequired: Boolean(s.educationRequired),
      costCoveragePercent: s.costCoveragePercent || 90,
      subsidyDetails: s.subsidyDetails,
      sourceUrl: s.sourceUrl || 'https://nsfdc.nic.in',
      lastVerified: s.lastVerified || new Date(),
      matchScore: s.matchScore,
      matchReasons: s.matchReasons || []
    }));

    // Optional background analytics log (non-blocking)
    try {
      if (RecommendationLog) {
        RecommendationLog.create({
          queryInput: {
            income: numIncome,
            projectCost: numCost,
            projectType: projectType || 'small_business',
            isEducation: Boolean(isEducation),
            gender: gender || 'female'
          },
          recommendedSchemes: formatted.map(f => ({
            schemeName: f.schemeName,
            matchScore: f.matchScore,
            matchReasons: f.matchReasons,
            sourceUrl: f.sourceUrl
          })),
          matchedCount: formatted.length
        }).catch(() => {}); // silently ignore if in offline memory mode
      }
    } catch (_) {}

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('Error in /api/recommend:', err);
    return res.status(500).json({
      error: 'Internal server error while processing recommendation',
      details: err.message
    });
  }
});

module.exports = router;
