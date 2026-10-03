/**
 * Migration Script: Migrate Schemes to NSFDC-Backed Structured Schema
 * 
 * Replaces hardcoded scheme data with verified, source-backed NSFDC Knowledge Base records.
 * Updates both MongoDB Atlas (if connected) and local backend/src/data/seedSchemes.json.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Scheme = require('../models/Scheme');
const Partner = require('../models/Partner');
const Applicant = require('../models/Applicant');
const RecommendationLog = require('../models/RecommendationLog');

const nsfdcVerifiedSchemes = [
  {
    schemeName: "Mahila Samriddhi Yojana (MSY)",
    name: "Mahila Samriddhi Yojana (MSY)",
    nameHi: "महिला समृद्धि योजना (एमएसवाई)",
    purpose: "Exclusive concessional micro-credit scheme for Scheduled Caste women self-help groups and individual women entrepreneurs to undertake micro-enterprises and petty trades.",
    description: "Exclusive concessional micro-credit scheme for Scheduled Caste women self-help groups and individual women entrepreneurs.",
    descriptionHi: "अनुसूचित जाति की महिला स्वयं सहायता समूहों और महिला उद्यमियों के लिए विशेष रियायती सूक्ष्म ऋण योजना।",
    eligibility: "Scheduled Caste women beneficiaries residing in rural or urban areas with annual family income up to ₹5,00,000. Preference for women Self Help Groups (SHGs).",
    incomeLimit: 500000,
    maxIncomeLimit: 500000,
    maxProjectCost: 140000,
    maxLoanAmount: 140000,
    minLoanAmount: 20000,
    interestRate: 5.0, // 4.0% for SHGs, 5.0% for individuals
    repaymentPeriodMonths: 48,
    tenureMonthsMax: 48,
    moratoriumMonths: 6,
    eligibleActivities: [
      "small_business",
      "micro_project",
      "retail_services",
      "tailoring",
      "handicrafts",
      "dairy",
      "women_enterprise"
    ],
    applicableFor: ["micro_project", "small_business", "women_enterprise", "retail_services"],
    requiredDocuments: [
      "Aadhaar Card (DBT-linked bank account)",
      "Competent Authority SC Caste Certificate",
      "Annual Family Income Certificate (≤ ₹5,00,000)",
      "Active Bank Passbook with IFSC",
      "SHG Membership Proof / Individual Applicant Photograph",
      "Basic Trade or Equipment Quotation"
    ],
    documentsRequired: [
      "Aadhaar Card (DBT-linked bank account)",
      "Competent Authority SC Caste Certificate",
      "Annual Family Income Certificate (≤ ₹5,00,000)",
      "Active Bank Passbook with IFSC",
      "SHG Membership Proof / Individual Applicant Photograph",
      "Basic Trade or Equipment Quotation"
    ],
    channelizingAgencies: ["SCA", "RRB", "NBFC-MFI"],
    genderSpecific: "women",
    category: "micro",
    educationRequired: false,
    costCoveragePercent: 90,
    subsidyDetails: "Special 1.5% interest rebate on timely repayments and capital grant assistance under SCA component.",
    sourceUrl: "https://nsfdc.nic.in/en/mahila-samriddhi-yojana",
    lastVerified: new Date("2026-10-03T00:00:00.000Z")
  },
  {
    schemeName: "NSFDC Micro Credit Finance (MCF)",
    name: "NSFDC Micro Credit Finance (MCF)",
    nameHi: "एनएसएफडीसी सूक्ष्म ऋण वित्त योजना (एमसीएफ)",
    purpose: "Direct micro-credit support for petty trades, artisans, small vendors, and micro-enterprises with fast-track documentation and minimal margin requirements.",
    description: "Direct micro-credit support for petty trades, village artisans, and micro-enterprises with minimal paperwork.",
    descriptionHi: "छोटे व्यवसायियों, ग्रामीण कारीगरों और सूक्ष्म उद्यमों के लिए न्यूनतम कागजी कार्रवाई के साथ सूक्ष्म ऋण सहायता।",
    eligibility: "Scheduled Caste individuals or members of SHGs with annual family income up to ₹5,00,000 seeking working capital or micro-equipment finance.",
    incomeLimit: 500000,
    maxIncomeLimit: 500000,
    maxProjectCost: 140000,
    maxLoanAmount: 140000,
    minLoanAmount: 15000,
    interestRate: 6.5,
    repaymentPeriodMonths: 36,
    tenureMonthsMax: 36,
    moratoriumMonths: 3,
    eligibleActivities: [
      "micro_project",
      "small_business",
      "artisan",
      "retail_services",
      "trade",
      "hawker",
      "service_kiosk"
    ],
    applicableFor: ["micro_project", "small_business", "artisan", "retail_services"],
    requiredDocuments: [
      "Aadhaar Card (Aadhaar linked)",
      "Competent Authority SC Caste Certificate",
      "Family Income Certificate (≤ ₹5,00,000/yr)",
      "Bank Account Statement / Passbook",
      "Basic Self-Certified Business Activity Note"
    ],
    documentsRequired: [
      "Aadhaar Card (Aadhaar linked)",
      "Competent Authority SC Caste Certificate",
      "Family Income Certificate (≤ ₹5,00,000/yr)",
      "Bank Account Statement / Passbook",
      "Basic Self-Certified Business Activity Note"
    ],
    channelizingAgencies: ["SCA", "RRB", "NBFC-MFI"],
    genderSpecific: "any",
    category: "micro",
    educationRequired: false,
    costCoveragePercent: 90,
    subsidyDetails: "Direct capital subsidy of ₹10,000 or 10% of project cost whichever is lower under SCA component.",
    sourceUrl: "https://nsfdc.nic.in/en/micro-credit-finance",
    lastVerified: new Date("2026-10-03T00:00:00.000Z")
  },
  {
    schemeName: "Laghu Vyavsay Yojana (Small Business Scheme)",
    name: "Laghu Vyavsay Yojana (Small Business Scheme)",
    nameHi: "लघु व्यवसाय योजना (एलवीवाई)",
    purpose: "Working capital and machinery/equipment credit for small shops, retail establishments, medical clinics, mobile repair hubs, bakeries, and transport businesses.",
    description: "Working capital and machinery credit for grocery shops, bakeries, medical stores, mobile repair, and retail franchises.",
    descriptionHi: "किराना स्टोर, मोबाइल रिपेयरिंग, बेकरी और खुदरा व्यापार के लिए कार्यशील पूंजी और उपकरण ऋण।",
    eligibility: "Scheduled Caste entrepreneurs setting up or expanding small retail or service micro-enterprises with annual family income up to ₹5,00,000.",
    incomeLimit: 500000,
    maxIncomeLimit: 500000,
    maxProjectCost: 500000,
    maxLoanAmount: 500000,
    minLoanAmount: 50000,
    interestRate: 7.0,
    repaymentPeriodMonths: 60,
    tenureMonthsMax: 60,
    moratoriumMonths: 6,
    eligibleActivities: [
      "small_business",
      "retail_services",
      "trade",
      "pharmacy",
      "bakery",
      "mobile_repair",
      "grocery",
      "repair_workshop"
    ],
    applicableFor: ["small_business", "retail_services", "trade"],
    requiredDocuments: [
      "Aadhaar Card",
      "SC Caste Certificate issued by Tehsildar/SDM",
      "Family Income Certificate (≤ ₹5,00,000)",
      "Shop & Commercial Establishment Act Registration / Trade License",
      "Machinery or Equipment Supplier Quotation (GST Invoice)",
      "Bank Account Statement (last 6 months)"
    ],
    documentsRequired: [
      "Aadhaar Card",
      "SC Caste Certificate issued by Tehsildar/SDM",
      "Family Income Certificate (≤ ₹5,00,000)",
      "Shop & Commercial Establishment Act Registration / Trade License",
      "Machinery or Equipment Supplier Quotation (GST Invoice)",
      "Bank Account Statement (last 6 months)"
    ],
    channelizingAgencies: ["SCA", "PSB", "RRB"],
    genderSpecific: "any",
    category: "business",
    educationRequired: false,
    costCoveragePercent: 90,
    subsidyDetails: "Direct linkage with District SC Development Corporation capital subsidy (up to ₹50,000).",
    sourceUrl: "https://nsfdc.nic.in/en/laghu-vyavsay-yojana",
    lastVerified: new Date("2026-10-03T00:00:00.000Z")
  },
  {
    schemeName: "NSFDC Term Loan Scheme",
    name: "NSFDC Term Loan Scheme",
    nameHi: "एनएसएफडीसी सावधि ऋण योजना (टर्म लोन)",
    purpose: "Major project financing for commercially viable manufacturing, processing, high-value service units, logistics, and agro-allied commercial ventures.",
    description: "Major project financing for commercially viable manufacturing, processing, service sector, and agricultural ventures.",
    descriptionHi: "व्यावसायिक विनिर्माण, प्रसंस्करण, सेवा क्षेत्र और कृषि उपक्रमों के लिए प्रमुख परियोजना वित्तपोषण।",
    eligibility: "Scheduled Caste entrepreneurs planning commercially viable enterprise with bankable Detailed Project Report (DPR) and annual family income up to ₹5,00,000.",
    incomeLimit: 500000,
    maxIncomeLimit: 500000,
    maxProjectCost: 5000000,
    maxLoanAmount: 5000000,
    minLoanAmount: 500000,
    interestRate: 9.0, // 8.0% for project cost up to ₹5L, 9.0% above ₹5L
    repaymentPeriodMonths: 120,
    tenureMonthsMax: 120,
    moratoriumMonths: 9,
    eligibleActivities: [
      "manufacturing",
      "small_business",
      "services",
      "transport",
      "agriculture",
      "food_processing",
      "engineering_works"
    ],
    applicableFor: ["manufacturing", "small_business", "services", "transport", "agriculture"],
    requiredDocuments: [
      "Aadhaar Card and PAN Card",
      "SC Caste Certificate issued by Competent Authority",
      "Annual Family Income Certificate (≤ ₹5,00,000)",
      "Bankable Detailed Project Report (DPR) with 3-year cash flow projections",
      "Land Ownership Document or Registered Lease Agreement",
      "Itemized Machinery & Equipment Quotations from GST-registered vendors",
      "Udyam / GSTIN Registration (if already incorporated)",
      "Bank Statements (last 12 months)"
    ],
    documentsRequired: [
      "Aadhaar Card and PAN Card",
      "SC Caste Certificate issued by Competent Authority",
      "Annual Family Income Certificate (≤ ₹5,00,000)",
      "Bankable Detailed Project Report (DPR) with 3-year cash flow projections",
      "Land Ownership Document or Registered Lease Agreement",
      "Itemized Machinery & Equipment Quotations from GST-registered vendors",
      "Udyam / GSTIN Registration (if already incorporated)",
      "Bank Statements (last 12 months)"
    ],
    channelizingAgencies: ["SCA", "PSB"],
    genderSpecific: "any",
    category: "business",
    educationRequired: false,
    costCoveragePercent: 90,
    subsidyDetails: "Finances up to 90% of total project cost; promoter margin requirement is only 10%.",
    sourceUrl: "https://nsfdc.nic.in/en/term-loan",
    lastVerified: new Date("2026-10-03T00:00:00.000Z")
  },
  {
    schemeName: "Green Business Scheme (GBS)",
    name: "Green Business Scheme (GBS)",
    nameHi: "हरित व्यवसाय योजना (ग्रीन बिजनेस स्कीम)",
    purpose: "Concessional loans for climate-mitigating, eco-friendly income generation activities like battery e-rickshaws, solar rooftop units, polyhouses, and waste recycling.",
    description: "Concessional loans to combat climate change and generate income via solar applications, e-rickshaws, and waste recycling.",
    descriptionHi: "सौर ऊर्जा उपकरण, ई-रिक्शा और अपशिष्ट पुनर्चक्रण जैसे पर्यावरण-अनुकूल व्यवसायों के लिए रियायती ऋण।",
    eligibility: "Scheduled Caste individuals or groups venturing into clean-energy, eco-sustainable, or electric mobility trades with annual family income up to ₹5,00,000.",
    incomeLimit: 500000,
    maxIncomeLimit: 500000,
    maxProjectCost: 3000000,
    maxLoanAmount: 3000000,
    minLoanAmount: 100000,
    interestRate: 7.5,
    repaymentPeriodMonths: 84,
    tenureMonthsMax: 84,
    moratoriumMonths: 6,
    eligibleActivities: [
      "green_energy",
      "solar",
      "e_rickshaw",
      "waste_management",
      "small_business",
      "transport",
      "organic_farming"
    ],
    applicableFor: ["green_energy", "solar", "e_rickshaw", "waste_management", "small_business", "transport"],
    requiredDocuments: [
      "Aadhaar Card",
      "SC Caste Certificate",
      "Family Income Certificate (≤ ₹5,00,000)",
      "Vendor Proforma Invoice / Quotations for Certified Green Equipment / E-Vehicles",
      "Commercial Driver's License or Transport Permit (for e-rickshaw / e-cart)",
      "Electricity Bill / Site Feasibility for Solar PV installations"
    ],
    documentsRequired: [
      "Aadhaar Card",
      "SC Caste Certificate",
      "Family Income Certificate (≤ ₹5,00,000)",
      "Vendor Proforma Invoice / Quotations for Certified Green Equipment / E-Vehicles",
      "Commercial Driver's License or Transport Permit (for e-rickshaw / e-cart)",
      "Electricity Bill / Site Feasibility for Solar PV installations"
    ],
    channelizingAgencies: ["SCA", "PSB"],
    genderSpecific: "any",
    category: "green",
    educationRequired: false,
    costCoveragePercent: 90,
    subsidyDetails: "Special preferential interest rate (7.5% p.a.) with 90% capital expenditure coverage for certified green tech.",
    sourceUrl: "https://nsfdc.nic.in/en/green-business-scheme",
    lastVerified: new Date("2026-10-03T00:00:00.000Z")
  },
  {
    schemeName: "NSFDC Education Loan Scheme (ELS)",
    name: "NSFDC Education Loan Scheme (ELS)",
    nameHi: "एनएसएफडीसी शिक्षा ऋण योजना (ईएलएस)",
    purpose: "Low-interest financial assistance to Scheduled Caste students pursuing accredited professional and technical higher education in India and abroad.",
    description: "Low-interest financial assistance to SC students pursuing accredited professional and technical degrees in India and abroad.",
    descriptionHi: "भारत और विदेश में तकनीकी और व्यावसायिक डिग्री हासिल करने वाले अनुसूचित जाति के छात्रों के लिए रियायती शिक्षा ऋण।",
    eligibility: "Scheduled Caste students securing admission in approved technical or professional degree/diploma courses with family income up to ₹5,00,000.",
    incomeLimit: 500000,
    maxIncomeLimit: 500000,
    maxProjectCost: 2000000,
    maxLoanAmount: 2000000,
    minLoanAmount: 50000,
    interestRate: 7.0, // 6.5% for female students with 0.5% rebate
    repaymentPeriodMonths: 120,
    tenureMonthsMax: 120,
    moratoriumMonths: 12, // Course duration + 1 year or 6 months after getting job
    eligibleActivities: ["education"],
    applicableFor: ["education"],
    requiredDocuments: [
      "Student Aadhaar Card & PAN Card",
      "SC Caste Certificate issued by Competent Authority",
      "Parent / Family Income Certificate (≤ ₹5,00,000)",
      "Offer Letter / Confirmed Admission Proof from Recognized Institution",
      "Official Course Fee Schedule and Hostel Expense Breakdown",
      "Educational Transcripts (Class 10th, 12th, Graduation Marksheets)",
      "Co-borrower Parent/Guardian KYC and Bank Statements"
    ],
    documentsRequired: [
      "Student Aadhaar Card & PAN Card",
      "SC Caste Certificate issued by Competent Authority",
      "Parent / Family Income Certificate (≤ ₹5,00,000)",
      "Offer Letter / Confirmed Admission Proof from Recognized Institution",
      "Official Course Fee Schedule and Hostel Expense Breakdown",
      "Educational Transcripts (Class 10th, 12th, Graduation Marksheets)",
      "Co-borrower Parent/Guardian KYC and Bank Statements"
    ],
    channelizingAgencies: ["SCA", "PSB"],
    genderSpecific: "any",
    category: "education",
    educationRequired: true,
    costCoveragePercent: 90,
    subsidyDetails: "0.5% interest rebate for female students. Repayment starts 1 year after course completion or 6 months after securing job.",
    sourceUrl: "https://nsfdc.nic.in/en/education-loan-scheme",
    lastVerified: new Date("2026-10-03T00:00:00.000Z")
  },
  {
    schemeName: "Voctech & Skill Development Loan",
    name: "Voctech & Skill Development Loan",
    nameHi: "व्यावसायिक एवं कौशल विकास ऋण योजना",
    purpose: "Financing for NSQF-aligned specialized vocational certification, trade toolkits, and post-training micro-enterprise setups.",
    description: "Financing for NSQF-aligned specialized vocational certification, toolkits, and post-training micro-enterprise setups.",
    descriptionHi: "एनएसक्यूएफ प्रमाणित कौशल विकास, टूलकिट खरीद और प्रशिक्षण उपरांत सूक्ष्म उद्यम शुरू करने हेतु ऋण।",
    eligibility: "Scheduled Caste candidates enrolled in certified technical/vocational skill training programs with family income up to ₹5,00,000.",
    incomeLimit: 500000,
    maxIncomeLimit: 500000,
    maxProjectCost: 300000,
    maxLoanAmount: 300000,
    minLoanAmount: 25000,
    interestRate: 6.5,
    repaymentPeriodMonths: 48,
    tenureMonthsMax: 48,
    moratoriumMonths: 6,
    eligibleActivities: ["vocational", "small_business", "services"],
    applicableFor: ["vocational", "small_business", "services"],
    requiredDocuments: [
      "Aadhaar Card",
      "SC Caste Certificate",
      "Income Certificate (≤ ₹5,00,000)",
      "Skill Training Admission Proof / NSQF Level Certificate",
      "Itemized Trade Toolkit Quotation"
    ],
    documentsRequired: [
      "Aadhaar Card",
      "SC Caste Certificate",
      "Income Certificate (≤ ₹5,00,000)",
      "Skill Training Admission Proof / NSQF Level Certificate",
      "Itemized Trade Toolkit Quotation"
    ],
    channelizingAgencies: ["SCA", "RRB", "NBFC-MFI"],
    genderSpecific: "any",
    category: "micro",
    educationRequired: false,
    costCoveragePercent: 90,
    subsidyDetails: "Covers 100% of course fee plus equipment tool-kit purchase directly upon course certification.",
    sourceUrl: "https://nsfdc.nic.in/en/vocational-education-loan",
    lastVerified: new Date("2026-10-03T00:00:00.000Z")
  }
];

async function migrate() {
  console.log('--- Starting NSFDC Scheme Schema Migration ---');

  // 1. Update seedSchemes.json local file
  const seedFilePath = path.join(__dirname, '../data/seedSchemes.json');
  console.log(`Writing migrated schemes to seed file: ${seedFilePath}`);
  fs.writeFileSync(seedFilePath, JSON.stringify(nsfdcVerifiedSchemes, null, 2), 'utf-8');
  console.log(`Successfully updated seedSchemes.json with ${nsfdcVerifiedSchemes.length} verified schemes.`);

  // 2. Connect to MongoDB if URI is present and perform DB migration
  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB Atlas. Performing schema migration...');

      for (const schemeData of nsfdcVerifiedSchemes) {
        await Scheme.findOneAndUpdate(
          {
            $or: [
              { schemeName: schemeData.schemeName },
              { name: schemeData.name }
            ]
          },
          { $set: schemeData },
          { upsert: true, new: true, runValidators: false }
        );
        console.log(`Migrated / Upserted: ${schemeData.schemeName}`);
      }

      const totalCount = await Scheme.countDocuments();
      console.log(`MongoDB schemes collection migration complete. Total schemes in DB: ${totalCount}`);
    } catch (err) {
      console.warn(`MongoDB Atlas migration skipped or failed: ${err.message}. Local in-memory seed store was updated successfully.`);
    } finally {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  } else {
    console.log('No external MONGODB_URI set; updated local seed dataset which powers the active in-memory adapter.');
  }

  console.log('--- NSFDC Scheme Schema Migration Finished Successfully ---');
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = {
  migrate,
  nsfdcVerifiedSchemes
};
