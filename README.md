# Scheme Setu (योजना सेतु) — NSFDC Concessional Credit Portal

> **Description:** Scheme Setu is an AI-assisted citizen-centric platform that matches marginalized entrepreneurs with potentially suitable NSFDC financial schemes using official eligibility rules, while providing loan simulation, document guidance, and authorized channel-partner discovery.

---

## 🏛️ Architecture Flow

```
Official NSFDC Data 
  ➔ Structured Knowledge Base (MongoDB & Seed Store)
    ➔ AI-Assisted Matching (Official Eligibility Rules & Gender/Activity Fit)
      ➔ Personalized Scheme Recommendations (with Verifiable Match Reasons)
        ➔ Financial Simulation (Moratorium-Aware EMI Calculator)
          ➔ Document Guidance (Scheme-Specific Zero-Rejection Checklist & DPR)
            ➔ Authorized Partner Locator (Geo-Spatial Discovery for SCAs, PSBs, RRBs, NBFC-MFIs)
```

---

## ⚖️ Official Governance & AI Claim Specification

> **Official Disclaimer:** The AI-assisted matching engine interprets citizen requirements and compares them against structured official NSFDC eligibility rules to identify potentially suitable schemes. Final eligibility is determined by the relevant channelizing agency.

---

## 📚 Structured NSFDC Scheme Knowledge Base

Every scheme record in Scheme Setu is mapped to verified central guidelines with active provenance:

| Scheme Name | Ceiling | Concessional Rate | Category | Authorized Channelizing Agencies | Source URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mahila Samriddhi Yojana (MSY)** | ₹1,40,000 | **4%–5% p.a.** | Micro / Women | SCA, RRB, NBFC-MFI | [NSFDC MSY](https://nsfdc.nic.in/en/mahila-samriddhi-yojana) |
| **Micro Credit Finance (MCF)** | ₹1,40,000 | **6.5% p.a.** | Micro / Artisans | SCA, RRB, NBFC-MFI | [NSFDC MCF](https://nsfdc.nic.in/en/micro-credit-finance) |
| **Laghu Vyavsay Yojana (LVY)** | ₹5,00,000 | **7.0% p.a.** | Small Business | SCA, PSB, RRB | [NSFDC LVY](https://nsfdc.nic.in/en/laghu-vyavsay-yojana) |
| **Green Business Scheme (GBS)** | ₹30,00,000 | **7.5% p.a.** | Clean Energy / EV | SCA, PSB | [NSFDC GBS](https://nsfdc.nic.in/en/green-business-scheme) |
| **NSFDC Term Loan Scheme** | ₹50,00,000 | **9.0% p.a.** | Manufacturing / Trade | SCA, PSB | [NSFDC TLS](https://nsfdc.nic.in/en/term-loan) |
| **NSFDC Education Loan Scheme (ELS)**| ₹20,00,000 | **7.0% p.a.** (6.5% for women) | Higher Education | SCA, PSB | [NSFDC ELS](https://nsfdc.nic.in/en/education-loan-scheme) |
| **Voctech & Skill Development Loan** | ₹3,00,000 | **6.5% p.a.** | Vocational / Toolkit | SCA, RRB, NBFC-MFI | [NSFDC Voctech](https://nsfdc.nic.in/en/vocational-education-loan) |

---

## 🛠️ Tech Stack & Key Components

- **Frontend**: React (Vite), TailwindCSS, Leaflet & React-Leaflet (OpenStreetMap), Lucide Icons, i18next (English & हिन्दी).
- **Backend**: Node.js, Express, MongoDB (Atlas Mongoose connection with high-speed built-in seed store fallback).
- **Rule Engine**: Rule-based matching evaluator generating deterministic `matchReasons` and match scores without hallucination.

### Quick Start

```bash
# 1. Start Backend API (:5000)
cd backend
npm install
node src/server.js

# 2. Run NSFDC Schema Migration (optional, already integrated in seed store)
node src/scripts/migrateToNSFDCSchema.js

# 3. Start Frontend App (:5173)
cd ../frontend
npm install
npm run dev
```

---

## 🔗 Repository & Live Deployment

- **Live Web App**: [https://scheme-setu-beryl.vercel.app](https://scheme-setu-beryl.vercel.app)
- **GitHub Repository**: [https://github.com/yashica-tech-flare/scheme-setu](https://github.com/yashica-tech-flare/scheme-setu)
- **Backend Live API (Render)**: [https://scheme-setu-wccq.onrender.com](https://scheme-setu-wccq.onrender.com)
- **API Health Check**: [https://scheme-setu-wccq.onrender.com/api/health](https://scheme-setu-wccq.onrender.com/api/health)

