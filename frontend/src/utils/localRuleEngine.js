import fallbackSchemes from '../data/fallbackSchemes.json';
import fallbackPartners from '../data/fallbackPartners.json';

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

export function distanceKm(lat1, lng1, lat2, lng2) {
  const nLat1 = Number(lat1);
  const nLng1 = Number(lng1);
  const nLat2 = Number(lat2);
  const nLng2 = Number(lng2);

  if (isNaN(nLat1) || isNaN(nLng1) || isNaN(nLat2) || isNaN(nLng2)) {
    return null;
  }

  const R = 6371; // Earth radius km
  const dLat = (nLat2 - nLat1) * Math.PI / 180;
  const dLng = (nLng2 - nLng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(nLat1 * Math.PI / 180) *
      Math.cos(nLat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function getPartnersLocally(params = {}) {
  const { lat, lng, radiusKm, type, scheme, city } = params;
  const hasCoords = lat !== undefined && lng !== undefined && lat !== '' && lng !== '';
  const userLat = Number(lat);
  const userLng = Number(lng);
  const maxRadius = radiusKm ? Number(radiusKm) : null;

  let list = fallbackPartners.filter(p => {
    if (type && p.type !== type) return false;
    if (city && city !== 'All India' && !p.city.toLowerCase().includes(city.toLowerCase()) && !p.state.toLowerCase().includes(city.toLowerCase())) {
      return false;
    }
    if (scheme && Array.isArray(p.schemesHandled) && !p.schemesHandled.includes(scheme)) {
      return false;
    }
    return true;
  });

  list = list.map(p => {
    let dKm = null;
    if (hasCoords && p.location?.lat && p.location?.lng) {
      dKm = distanceKm(userLat, userLng, p.location.lat, p.location.lng);
    }
    return {
      ...p,
      _id: p._id || p.name,
      distanceKm: dKm
    };
  });

  if (hasCoords) {
    list.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  if (hasCoords && maxRadius && maxRadius < 2000) {
    const withinRadius = list.filter(p => p.distanceKm !== null && p.distanceKm <= maxRadius);
    if (withinRadius.length > 0) return withinRadius;
    // Always return closest partners even if beyond current radius slider, so user is never stranded
    return list.slice(0, 5);
  }

  return list;
}
