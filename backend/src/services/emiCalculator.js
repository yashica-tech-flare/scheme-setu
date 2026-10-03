/**
 * Scheme-Aware EMI Calculator with Moratorium Support
 */

function calculateEMI(principalInput, annualRateInput, tenureMonthsInput, moratoriumMonthsInput = 0) {
  const principal = Math.max(0, Number(principalInput) || 0);
  const annualRate = Math.max(0, Number(annualRateInput) || 0);
  const tenureMonths = Math.max(1, Number(tenureMonthsInput) || 12);
  const moratoriumMonths = Math.min(tenureMonths - 1, Math.max(0, Number(moratoriumMonthsInput) || 0));

  const effectiveTenure = Math.max(1, tenureMonths - moratoriumMonths);

  if (principal === 0) {
    return {
      monthlyEMI: 0,
      totalPayment: 0,
      totalInterest: 0,
      effectiveTenure,
      moratoriumMonths,
      commercialComparison: {
        commercialRate: 15,
        commercialEMI: 0,
        commercialTotalInterest: 0,
        totalSavings: 0
      }
    };
  }

  // Handle 0% interest edge case
  if (annualRate === 0) {
    const emi = Math.round(principal / effectiveTenure);
    return {
      monthlyEMI: emi,
      totalPayment: principal,
      totalInterest: 0,
      effectiveTenure,
      moratoriumMonths
    };
  }

  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, effectiveTenure)) /
              (Math.pow(1 + monthlyRate, effectiveTenure) - 1);

  const totalPayment = emi * effectiveTenure;
  const totalInterest = totalPayment - principal;

  // Commercial comparison (standard commercial NBFC/Bank loan at ~15% interest without moratorium)
  const commercialRate = 15;
  const commMonthlyRate = commercialRate / 12 / 100;
  const commEMI = (principal * commMonthlyRate * Math.pow(1 + commMonthlyRate, tenureMonths)) /
                  (Math.pow(1 + commMonthlyRate, tenureMonths) - 1);
  const commTotalPayment = commEMI * tenureMonths;
  const commTotalInterest = Math.max(0, commTotalPayment - principal);
  const totalSavings = Math.max(0, Math.round(commTotalInterest - totalInterest));

  return {
    monthlyEMI: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.max(0, Math.round(totalInterest)),
    effectiveTenure,
    moratoriumMonths,
    commercialComparison: {
      commercialRate,
      commercialEMI: Math.round(commEMI),
      commercialTotalInterest: Math.round(commTotalInterest),
      totalSavings
    }
  };
}

module.exports = {
  calculateEMI
};
