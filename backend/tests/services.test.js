const test = require('node:test');
const assert = require('node:assert');
const { recommendScheme, computeScore } = require('../src/services/ruleEngine');
const { calculateEMI } = require('../src/services/emiCalculator');
const { distanceKm } = require('../src/services/distanceUtil');

test('Rule Engine: recommends schemes according to income, project type, and cost', () => {
  const sampleSchemes = [
    {
      name: 'Micro Finance Scheme',
      interestRate: 6.5,
      maxLoanAmount: 140000,
      maxIncomeLimit: 500000,
      applicableFor: ['small_business', 'micro_project'],
      educationRequired: false,
      moratoriumMonths: 3
    },
    {
      name: 'Term Loan Scheme',
      interestRate: 9.0,
      maxLoanAmount: 5000000,
      maxIncomeLimit: 500000,
      applicableFor: ['small_business', 'manufacturing'],
      educationRequired: false,
      moratoriumMonths: 6
    },
    {
      name: 'Education Loan Scheme',
      interestRate: 7.0,
      maxLoanAmount: 2000000,
      maxIncomeLimit: 500000,
      applicableFor: ['education'],
      educationRequired: true,
      moratoriumMonths: 12
    }
  ];

  // Test 1: Small business with 1 lakh cost, 3 lakh income
  const businessResult = recommendScheme(
    { income: 300000, projectCost: 100000, projectType: 'small_business', isEducation: false },
    sampleSchemes
  );
  assert.strictEqual(businessResult.length, 2);
  assert.strictEqual(businessResult[0].name, 'Micro Finance Scheme'); // Closer fit to 1L than 50L

  // Test 2: Education loan
  const eduResult = recommendScheme(
    { income: 250000, projectCost: 800000, projectType: 'education', isEducation: true },
    sampleSchemes
  );
  assert.strictEqual(eduResult.length, 1);
  assert.strictEqual(eduResult[0].name, 'Education Loan Scheme');

  // Test 3: Income exceeding 5 lakh
  const highIncomeResult = recommendScheme(
    { income: 600000, projectCost: 100000, projectType: 'small_business', isEducation: false },
    sampleSchemes
  );
  assert.strictEqual(highIncomeResult.length, 0);
});

test('EMI Calculator: calculates reducing balance EMI with moratorium', () => {
  // Principal 1,00,000, 6.5% interest, 36 months tenure, 3 months moratorium
  const emiData = calculateEMI(100000, 6.5, 36, 3);
  assert.ok(emiData.monthlyEMI > 0, 'EMI should be positive');
  assert.ok(emiData.totalPayment > 100000, 'Total payment should exceed principal');
  assert.strictEqual(emiData.effectiveTenure, 33);
  assert.strictEqual(emiData.moratoriumMonths, 3);
  assert.ok(emiData.commercialComparison.totalSavings > 0, 'Should demonstrate savings vs commercial loan');
});

test('Distance Utility: calculates Haversine distance between coordinates', () => {
  // Connaught Place (28.6315, 77.2167) to India Gate (28.6129, 77.2295) ~ 2.4 km
  const dist = distanceKm(28.6315, 77.2167, 28.6129, 77.2295);
  assert.ok(dist >= 2.0 && dist <= 3.0, `Expected ~2.4km, got ${dist}`);

  // Same coordinates should yield 0
  assert.strictEqual(distanceKm(28.6315, 77.2167, 28.6315, 77.2167), 0);
});
