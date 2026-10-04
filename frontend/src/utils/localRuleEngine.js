import fallbackSchemes from '../data/fallbackSchemes.json';

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

  const incomeLimit = scheme.incomeLimit || scheme.maxIncomeLimit || 500000;
  if (income <= incomeLimit) {
    reasons.push(`Income within ₹${incomeLimit.toLocaleString('en-IN')} official limit (Applicant: ₹${income.toLocaleString('en-IN')}/yr)`);
  }

  if (scheme.genderSpecific === 'women') {
    if (gender === 'female') {
      reasons.push('Exclusively tailored for Scheduled Caste women entrepreneurs & SHGs with 1.5% interest incentive');
    }
  } else if (isEducation && gender === 'female') {
    reasons.push('Eligible for 0.5% special interest rebate for female students under NSFDC guidelines');
  }

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

  const maxLoan = scheme.maxLoanAmount || 5000000;
  if (projectCost <= maxLoan) {
    reasons.push(`Requested amount (₹${projectCost.toLocaleString('en-IN')}) is within scheme maximum limit of ₹${maxLoan.toLocaleString('en-IN')}`);
  }

  if (scheme.interestRate) {
    reasons.push(`Concessional subsidized interest rate of ${scheme.interestRate}% p.a. (significantly below commercial bank rates)`);
  }

  if (scheme.moratoriumMonths && scheme.moratoriumMonths > 0) {
    reasons.push(`${scheme.moratoriumMonths}-month moratorium grace period before principal repayments begin`);
  }

  if (Array.isArray(scheme.channelizingAgencies) && scheme.channelizingAgencies.length > 0) {
    reasons.push(`Disbursed through authorized ${scheme.channelizingAgencies.join('/')} partner branches nationwide`);
  }

  return reasons;
}

export function recommendLocally(input) {
  const numIncome = Number(input.income);
  const numCost = Number(input.projectCost);
  const isEducation = Boolean(input.isEducation);
  const gender = (input.gender || 'female').toLowerCase();
  const projectType = input.projectType || 'small_business';

  if (numIncome > 500000) {
    return [];
  }

  const scored = fallbackSchemes
    .filter(scheme => {
      const incomeLimit = scheme.incomeLimit || scheme.maxIncomeLimit || 500000;
      if (numIncome > incomeLimit) return false;
      if (scheme.genderSpecific === 'women' && gender === 'male') return false;
      return true;
    })
    .map(scheme => {
      let score = 50;

      if (scheme.genderSpecific === 'women' && gender === 'female') {
        score += 25;
      }

      if (isEducation) {
        if (scheme.category === 'education' || scheme.educationRequired) {
          score += 35;
        } else {
          score -= 30;
        }
      } else {
        const matchesActivity = (Array.isArray(scheme.eligibleActivities) && scheme.eligibleActivities.includes(projectType)) ||
          (Array.isArray(scheme.applicableFor) && scheme.applicableFor.includes(projectType));
        if (matchesActivity) score += 20;

        if (numCost <= 140000 && scheme.category === 'micro') score += 15;
        if (numCost > 500000 && scheme.name.includes('Term Loan')) score += 15;
        if (projectType === 'green_energy' && scheme.category === 'green') score += 25;
      }

      if (numCost <= (scheme.maxLoanAmount || 5000000)) {
        score += 10;
      }

      score = Math.min(99, Math.max(40, score));

      return {
        ...scheme,
        _id: scheme._id || scheme.name,
        name: scheme.schemeName || scheme.name,
        schemeName: scheme.schemeName || scheme.name,
        matchScore: score,
        matchReasons: generateMatchReasons(scheme, { ...input, projectType })
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return scored;
}

export function calculateEMILocally(principal, annualRate, tenureMonths) {
  const p = Number(principal);
  const r = (Number(annualRate) / 12) / 100;
  const n = Number(tenureMonths);

  const monthlyEMI = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const totalPayment = monthlyEMI * n;
  const totalInterest = totalPayment - p;

  const commR = (15 / 12) / 100;
  const commercialEMI = Math.round((p * commR * Math.pow(1 + commR, n)) / (Math.pow(1 + commR, n) - 1));
  const commercialTotalInterest = (commercialEMI * n) - p;
  const totalSavings = Math.max(0, commercialTotalInterest - totalInterest);

  return {
    monthlyEMI,
    totalPayment,
    totalInterest,
    effectiveTenure: n,
    moratoriumMonths: 0,
    commercialComparison: {
      commercialRate: 15,
      commercialEMI,
      commercialTotalInterest,
      totalSavings
    }
  };
}
