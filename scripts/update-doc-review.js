const fs = require('fs');
const path = require('path');

const docPath = path.resolve(__dirname, '../docs/document-checklist-review.md');
let content = fs.readFileSync(docPath, 'utf8');

const oldTableStart = '| Doc ID | Document Title | Issuing Authority | Requirement Type | Applicable Schemes | NSFDC FAQ / Regulatory Source |';
const newTable = `| Doc ID | Document Title | Issuing Authority | Requirement Type | Applicable Schemes | NSFDC Regulatory Citation & Verification Status |
|:---|:---|:---|:---:|:---|:---|
| \`doc_aadhaar\` | Aadhaar Card (DBT-Linked) | UIDAI | **Mandatory** | All 7 Schemes | NSFDC FAQ Sec 4.1; MoSJE DBT Directive [VERIFIED: Official NSFDC FAQ] |
| \`doc_caste\` | SC Caste Certificate | Tehsildar / Sub-Divisional Magistrate (SDM) | **Mandatory** | All 7 Schemes | Article 341; State Revenue Dept Barcoded Certificate [VERIFIED: Official NSFDC Guidelines] |
| \`doc_income\` | Family Income Certificate (≤ ₹5L/yr) | Revenue Officer / Tehsildar | **Mandatory** | All 7 Schemes | NSFDC Revised Income Ceiling Circular [VERIFIED: Official NSFDC Guidelines] |
| \`doc_bank_passbook\` | Active Bank Passbook with IFSC | Scheduled Commercial Bank / RRB | **Mandatory** | All 7 Schemes | NPCI Aadhaar Mapping & DBT Verification Circular [VERIFIED: Official NSFDC FAQ] |
| \`doc_shg_photo\` | SHG Membership Proof / Photo | Self Help Group / Applicant | **Mandatory** | MSY | MSY Operational Guidelines Clause 6.2 [NOT VERIFIED - // TODO verify] |
| \`doc_quotation\` | Equipment / Machinery Quotation | Authorized GST Supplier | **Mandatory** (TLS, LVY) / **Conditional** (MSY > ₹20k) | TLS, LVY, MSY | NSFDC Unit Cost & Proforma Guidelines [VERIFIED: Official NSFDC Guidelines] |
| \`doc_business_note\` | Business Activity Note | Applicant Self-Declaration | **Mandatory** | MCF | MCF Micro-Appraisal Norms [NOT VERIFIED - // TODO verify] |
| \`doc_trade_license\` | Trade License / Shop Act Registration | Municipal Corporation / Gram Panchayat | **Conditional** (Fixed shop premises) | MCF | State Shops & Commercial Establishments Act [NOT VERIFIED - // TODO verify] |
| \`doc_udyam\` | Udyam / MSME Registration | Ministry of MSME | **Conditional** (Cost > ₹2 Lakh) | LVY | MSME Classification Notification S.O. 2119(E) [NOT VERIFIED - // TODO verify] |
| \`doc_land_lease\` | Shop / Land Lease Deed or Rent Agreement | Sub-Registrar / Property Owner | **Conditional** (Rented premises) | LVY, TLS | NSFDC Security & Asset Creation Norms [NOT VERIFIED - // TODO verify] |
| \`doc_dpr\` | Detailed Project Report (DPR) | Technical Consultant / CA | **Mandatory** | TLS | Projects > ₹2 Lakh 3-pillar cash flow profile [VERIFIED: Official NSFDC Guidelines] |
| \`doc_coborrower\` | Co-borrower / Guarantor KYC Documents | Co-borrower / Legal Guardian | **Mandatory** (ELS) / **Conditional** (TLS > ₹5L) | ELS, TLS | Bank guarantee / sanction norm [NOT VERIFIED - // TODO verify] |
| \`doc_green_invoice\` | Certified Green Equipment Proforma | MNRE/BIS Certified Green Vendor | **Mandatory** | GBS | Green Business Scheme Guidelines [NOT VERIFIED - // TODO verify] |
| \`doc_transport_permit\` | Transport Permit / Driver's Commercial License | Regional Transport Office (RTO) | **Conditional** (Commercial E-Vehicles) | GBS | Motor Vehicles Act 1988 [NOT VERIFIED - // TODO verify] |
| \`doc_solar_site\` | Solar Site Feasibility Report | DISCOM / Certified Solar Installer | **Conditional** (Rooftop / PV Solar) | GBS | MNRE Decentralized Solar Norms [NOT VERIFIED - // TODO verify] |
| \`doc_edu_admission\` | Confirmed Admission Offer Letter | Registrar of University / College | **Mandatory** | ELS | ELS Norms for Recognized Degree Courses [VERIFIED: Official NSFDC ELS Scheme] |
| \`doc_fee_schedule\` | Official Course Fee Schedule | Institute Finance Office | **Mandatory** | ELS, Voctech | University / ITI Approved Fee Structure Breakdown [VERIFIED: Official NSFDC ELS Scheme] |
| \`doc_transcripts\` | Academic Transcripts & Marksheets | Board of Education / University | **Mandatory** | ELS | Qualifying Exam Marks Cards [VERIFIED: Official NSFDC ELS Scheme] |
| \`doc_voctech_admission\` | Skill Course Admission Proof | NSDC / SSDM / ITI Training Center | **Mandatory** | Voctech | Voctech Loan Scheme for NSQF-Aligned Courses [VERIFIED: Official NSFDC Voctech Scheme] |
| \`doc_voctech_toolkit\` | Trade Toolkit Equipment Quotation | Certified Tool Supplier | **Conditional** (Toolkit grant request) | Voctech | NSFDC Tool-Kit Assistance Component [NOT VERIFIED - // TODO verify] |`;

const endTableMarker = '---';
const idxStart = content.indexOf(oldTableStart);
const idxEnd = content.indexOf(endTableMarker, idxStart);

if (idxStart !== -1 && idxEnd !== -1) {
  content = content.slice(0, idxStart) + newTable + '\n\n' + content.slice(idxEnd);
  content = content.replace('NSFDC/OPS/REV-2026/01 (Effective Jan 7, 2026)', 'NSFDC/OPS/REV-2026/01 [NOT VERIFIED - internal circular reference]');
  fs.writeFileSync(docPath, content, 'utf8');
  console.log('Successfully updated docs/document-checklist-review.md with verified vs not-verified citations.');
} else {
  console.error('Marker not found in doc!');
  process.exit(1);
}

