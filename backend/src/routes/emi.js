const express = require('express');
const router = express.Router();
const { calculateEMI } = require('../services/emiCalculator');

/**
 * POST /api/emi
 * Body: { principal, annualRate, tenureMonths, moratoriumMonths }
 * Returns: { monthlyEMI, totalPayment, totalInterest, commercialComparison, effectiveTenure, moratoriumMonths }
 */
router.post('/', (req, res) => {
  try {
    const { principal, annualRate, tenureMonths, moratoriumMonths } = req.body;

    if (principal === undefined || annualRate === undefined || tenureMonths === undefined) {
      return res.status(400).json({
        error: 'principal, annualRate, and tenureMonths are required'
      });
    }

    const numPrincipal = Number(principal);
    const numAnnualRate = Number(annualRate);
    const numTenureMonths = Number(tenureMonths);
    const numMoratoriumMonths = Number(moratoriumMonths || 0);

    if (isNaN(numPrincipal) || isNaN(numAnnualRate) || isNaN(numTenureMonths)) {
      return res.status(400).json({
        error: 'principal, annualRate, and tenureMonths must be valid numbers'
      });
    }

    const result = calculateEMI(numPrincipal, numAnnualRate, numTenureMonths, numMoratoriumMonths);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in /api/emi:', err);
    return res.status(500).json({
      error: 'Internal error while calculating EMI',
      details: err.message
    });
  }
});

module.exports = router;
