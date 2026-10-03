/**
 * Smart Scheme Recommender Rule Engine
 * Matches applicant profile against official NSFDC concessional government loan rules.
 */

function formatActivity(activity) {
  const map = {
    micro_project: 'Micro-Enterprise / Petty Trade',
    small_business: 'Small Business & Retail',
    retail_services: 'Retail & Service Kiosk',
    manufacturing: 'Manufacturing & Processing Unit',
    transport: 'Transport & Commercial Vehicle',
    agriculture: 'Agro-Allied Business',
    green_energy: 'Green Energy / E-Rickshaw / Solar',
    vocational: 'Vocational Training & Toolkits',
    education: 'Higher Professional Education'
  };
  return map[activity] || (activity ? activity.replace(/_/g, ' ') : 'General Enterprise');
}

function generateMatchReasons(scheme, input) {
  const reasons = [];
  const income = Number(input.income) || 0;
  const projectCost = Number(input.projectCost) || 0;
  const projectType = input.projectType || 'small_business';
  const isEducation = Boolean(input.isEducation);
  const gender = (input.gender || '').toLowerCase();

  // 1. Income rule check
  const incomeLimit = scheme.incomeLimit || scheme.maxIncomeLimit || 500000;
  if (income <= incomeLimit) {
    reasons.push(`Income within ₹${incomeLimit.toLocaleString('en-IN')} official limit (Applicant: ₹${income.toLocaleString('en-IN')}/yr)`);
  }

  // 2. Gender specific rules
  if (scheme.genderSpecific === 'women') {
    if (gender === 'female') {
      reasons.push('Exclusively tailored for Scheduled Caste women entrepreneurs & SHGs with 1.5% interest incentive');
    }
  } else if (isEducation && gender === 'female') {
    reasons.push('Eligible for 0.5% special interest rebate for female students under NSFDC guidelines');
  }

  // 3. Project type & category alignment
  if (isEducation && (scheme.category === 'education' || scheme.educationRequired)) {
    reasons.push('Direct match for approved professional, technical, or overseas degree programs');
  } else if (!isEducation) {
    const isActivityMatch = (Array.isArray(scheme.eligibleActivities) && scheme.eligibleActivities.includes(projectType)) ||
      (Array.isArray(scheme.applicableFor) && scheme.applicableFor.includes(projectType));
    
    if (isActivityMatch) {
      reasons.push(`Project type (${formatActivity(projectType)}) matches eligible activities under official guidelines`);
    }

    if (scheme.category === 'green' && (projectType === 'green_energy' || projectType === 'transport')) {
      reasons.push('Priority clean-energy window with 90% capital asset coverage');
    } else if (scheme.category === 'micro' && (projectType === 'micro_project' || projectType === 'small_business')) {
      reasons.push('Fast-track micro-finance window with minimal collateral & processing friction');
    }
  }

  // 4. Loan ceiling fit
  const maxLoan = scheme.maxLoanAmount || 5000000;
  if (projectCost <= maxLoan) {
    reasons.push(`Requested amount (₹${projectCost.toLocaleString('en-IN')}) is within scheme maximum limit of ₹${maxLoan.toLocaleString('en-IN')}`);
  }

  // 5. Interest rate & Moratorium advantages
  if (scheme.interestRate) {
    reasons.push(`Concessional subsidized interest rate of ${scheme.interestRate}% p.a. (significantly below commercial bank rates)`);
  }

  if (scheme.moratoriumMonths && scheme.moratoriumMonths > 0) {
    reasons.push(`${scheme.moratoriumMonths}-month moratorium grace period before principal repayments begin`);
  }

  // 6. Channel partner network
  if (Array.isArray(scheme.channelizingAgencies) && scheme.channelizingAgencies.length > 0) {
    reasons.push(`Disbursed through authorized ${scheme.channelizingAgencies.join('/')} partner branches nationwide`);
  }

  return reasons;
}

function computeScore(scheme, input) {
  const rate = Number(scheme.interestRate) || 8;
  const maxLoan = Number(scheme.maxLoanAmount) || 500000;
  const cost = Number(input.projectCost) || 50000;
  const gender = (input.gender || '').toLowerCase();
  const projectType = input.projectType || 'small_business';

  // Base interest score (lower rate gives higher score)
  let score = (12 - rate) * 5; // e.g. 5% -> 35 points, 9% -> 15 points

  // Loan amount fit (if cost is within 80% of maxLoan, higher fit)
  const ratio = cost / maxLoan;
  if (ratio <= 1.0) {
    score += (1 - Math.abs(ratio - 0.7) * 0.5) * 40; // up to 40 points
  } else {
    score += 10;
  }

  // Gender bonus for MSY
  if (scheme.genderSpecific === 'women' && gender === 'female') {
    score += 25;
  }

  // Activity match bonus
  if (Array.isArray(scheme.eligibleActivities) && scheme.eligibleActivities.includes(projectType)) {
    score += 15;
  }

  // Category specific bonuses
  if (input.isEducation && scheme.category === 'education') {
    score += 30;
  }
  if (!input.isEducation && scheme.category === 'green' && projectType === 'green_energy') {
    score += 20;
  }

  // Clamp score between 60% and 98%
  return Math.min(98, Math.max(60, Math.round(score)));
}

function recommendScheme(input, schemes = []) {
  const income = Number(input.income) || 0;
  const projectCost = Number(input.projectCost) || 0;
  const projectType = input.projectType || 'small_business';
  const isEducation = Boolean(input.isEducation);
  const gender = (input.gender || '').toLowerCase();

  // Normalize schemes to plain objects
  const plainSchemes = schemes.map(s => (s.toObject ? s.toObject() : { ...s }));

  const matched = plainSchemes
    // 1. Income filter (≤ ₹5,00,000)
    .filter(s => income <= (s.incomeLimit || s.maxIncomeLimit || 500000))

    // 2. Gender specific filter (e.g. MSY is for women; if male, exclude MSY)
    .filter(s => {
      if (s.genderSpecific === 'women' && gender === 'male') {
        return false;
      }
      return true;
    })

    // 3. Education vs Enterprise filter
    .filter(s => {
      if (isEducation) {
        return s.category === 'education' || Boolean(s.educationRequired);
      } else {
        // If not education, exclude education schemes
        return s.category !== 'education' && !Boolean(s.educationRequired);
      }
    })

    // 4. Max loan ceiling filter (cost must not exceed 1.5x max loan)
    .filter(s => {
      const maxLoan = s.maxLoanAmount || Infinity;
      return projectCost <= maxLoan * 1.25;
    })

    // 5. Compute match score and match reasons
    .map(s => {
      const matchScore = computeScore(s, { income, projectCost, projectType, isEducation, gender });
      const matchReasons = generateMatchReasons(s, { income, projectCost, projectType, isEducation, gender });
      return {
        ...s,
        matchScore,
        matchReasons
      };
    })

    // Sort by match score descending
    .sort((a, b) => b.matchScore - a.matchScore);

  return matched;
}

module.exports = {
  recommendScheme,
  computeScore,
  generateMatchReasons,
  formatActivity
};
