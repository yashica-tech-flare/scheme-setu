# Scheme Setu (योजना सेतु) — Pitch Deck

**Empowering Scheduled Caste Entrepreneurs & Students via Source-Backed Concessional Credit Discovery**

---

## Slide 1: Title & Core Vision

### **Scheme Setu (योजना सेतु)**
*The Bridge to Affirmative Economic Empowerment*

> **One-Line Description:** Scheme Setu is an AI-assisted citizen-centric platform that matches marginalized entrepreneurs with potentially suitable NSFDC financial schemes using official eligibility rules, while providing loan simulation, document guidance, and authorized channel-partner discovery.

- **Target Beneficiaries:** 200M+ Scheduled Caste (SC) citizens, small artisans, women SHGs, and vocational students across India.
- **Apex Alignment:** Ministry of Social Justice & Empowerment, National Scheduled Castes Finance & Development Corporation (NSFDC), and National Backward Classes Finance & Development Corporation (NBCFDC).
- **Core Value Proposition:** Zero Rejections • Zero Middleman Commissions • 100% Traceable to Official Government Gazette Norms.

---

## Slide 2: The Problem — 3 Critical Gaps in Concessional Credit

Despite thousands of crores allocated under central affirmative lending windows, marginalized SC beneficiaries face severe bottlenecks:

| Gap | Reality on the Ground | Impact on Marginalized Citizens |
| :--- | :--- | :--- |
| **1. Scheme Confusion** | 10+ overlapping schemes (MSY, MCF, TLS, GBS, ELS) with differing interest caps, subsidies, and gender rebates. | Beneficiaries apply for wrong schemes and get rejected, or miss out on women-exclusive 4%–5% rates (e.g. Mahila Samriddhi). |
| **2. Channel Partner Opacity** | Citizens do not know which physical bank branches handle NSFDC files vs standard commercial loans. | Branch officers turn applicants away saying *"we don't do this"*; applicants fall victim to commercial loans charging 15%–24% interest. |
| **3. Documentation Friction & Middlemen** | Complex Detailed Project Reports (DPR), income ceilings, and caste validation requirements. | Middlemen charge ₹5,000–₹15,000 to draft DPRs, or applications are rejected due to missing technical paperwork. |

---

## Slide 3: The Solution — 7-Module Citizen Architecture

Scheme Setu replaces informal brokers with an end-to-end digital public infrastructure:

```
[1. Screener] ➔ [2. Rule Engine] ➔ [3. Knowledge Base] ➔ [4. EMI Simulator] ➔ [5. Guide & DPR] ➔ [6. Partner Map] ➔ [7. Bhasha/i18n]
```

1. **Smart Eligibility Screener (`/`):** Evaluates SC status, family income ($\le$ ₹5,00,000/yr), loan purpose, and gender in 60 seconds.
2. **Rule-Based Matching Engine (`/results`):** Computes match scores and transparent, auditable match reasons.
3. **Structured NSFDC Knowledge Base:** Every scheme links to verified official URLs (`nsfdc.nic.in`) with active audit dates.
4. **Moratorium-Aware EMI Simulator:** Factors in 3–12 month grace periods and calculates interest saved vs commercial bank loans.
5. **Scheme-Specific Document Guidance (`/guide`):** Dynamic checklist outlining exact certificate issuers and DPR 3-pillar templates.
6. **Geo-Spatial Partner Locator (`/partners`):** Interactive OpenStreetMap / Leaflet visualizer filtering verified SCAs, PSBs, RRBs, and NBFC-MFIs.
7. **Bilingual Inclusion:** Full native Hindi (हिन्दी) and English support across all interfaces.

---

## Slide 4: Real Knowledge Base — Provenance, Not Placeholders

Every figure presented to the citizen is backed by official published corporation norms:

| Scheme Name | Ceiling | Interest Rate | Moratorium | Target Group | Official Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mahila Samriddhi Yojana (MSY)** | ₹1,40,000 | **4%–5% p.a.** | 6 Months | SC Women & SHGs | [Verified NSFDC MSY](https://nsfdc.nic.in/en/mahila-samriddhi-yojana) |
| **Micro Credit Finance (MCF)** | ₹1,40,000 | **6.5% p.a.** | 3 Months | Petty Trades & Artisans | [Verified NSFDC MCF](https://nsfdc.nic.in/en/micro-credit-finance) |
| **Laghu Vyavsay Yojana (LVY)** | ₹5,00,000 | **7.0% p.a.** | 6 Months | Small Retail & Services | [Verified NSFDC LVY](https://nsfdc.nic.in/en/laghu-vyavsay-yojana) |
| **Green Business Scheme (GBS)** | ₹30,00,000 | **7.5% p.a.** | 6 Months | Solar, E-Rickshaw, Clean Tech | [Verified NSFDC GBS](https://nsfdc.nic.in/en/green-business-scheme) |
| **NSFDC Term Loan Scheme (TLS)** | ₹50,00,000 | **9.0% p.a.** | 9 Months | Manufacturing & Agro Units | [Verified NSFDC TLS](https://nsfdc.nic.in/en/term-loan) |
| **Education Loan Scheme (ELS)** | ₹20,00,000 | **7.0% p.a.** (6.5% F) | 12 Months | Professional Degrees | [Verified NSFDC ELS](https://nsfdc.nic.in/en/education-loan-scheme) |
| **Voctech & Skill Development** | ₹3,00,000 | **6.5% p.a.** | 6 Months | NSQF Certified Skill Setups | [Verified NSFDC Voctech](https://nsfdc.nic.in/en/vocational-education-loan) |

---

## Slide 5: The "AI-Assisted, Not AI-Predicted" Framing

> **Why This Matters to Citizens, Regulators, and Judges:**
> A hallucinating "black box AI" predicting loan approvals creates false hopes, compliance violations, and legal liability. Scheme Setu adopts a rigorous, defensible standard:

### Our AI Governance Principles:
1. **Deterministic Rule Engine:** AI assists in profile parsing and semantic matching, but evaluates against structured official NSFDC criteria (income threshold, scheme ceilings, gender preferences).
2. **Transparent "Why this scheme?" Explanations:** Citizens see the exact criteria satisfied (e.g. *"Income within ₹5,00,000 limit"*, *"Exclusively reserved for SC women entrepreneurs"*).
3. **Official Disclaimer on Every Card:** *"The AI-assisted matching engine interprets your requirements and compares them against structured official NSFDC eligibility rules to identify potentially suitable schemes. Final eligibility is determined by the relevant channelizing agency."*

---

## Slide 6: Technology Architecture & Resilient Deployment

```
[ Frontend: Vite + React 18 + TailwindCSS + Leaflet / OSM ]
                            │
               REST API calls (JSON) / CORS
                            ▼
    [ Backend: Node.js + Express + Rule Engine Service ]
                            │
              Dual-Mode Data Abstraction Layer
               ┌────────────┴────────────┐
               ▼                         ▼
      [ MongoDB Atlas ]       [ In-Memory Fallback ]
    (Cloud Persistence)     (High-Speed Offline Store)
```

- **Zero-Dependency Fallback:** If internet or database credentials drop, the application seamlessly switches to its verified in-memory seed store without throwing 500 errors.
- **Production Ready:** Cleanly configured for deployment on **Render** (Node.js API) and **Vercel** (React SPA with `vercel.json` rewrites).

---

## Slide 7: Measurable Social Impact & Scalability Roadmap

1. **Financial Inclusion:** Directs marginalized beneficiaries to loans at **4%–9% p.a.** vs predatory unorganized lenders (36%–60% p.a.) or private commercial loans (15%+ p.a.).
2. **Eliminating Middlemen:** Estimated direct savings of **₹5,000 to ₹15,000** per applicant in project proposal and advisory fees.
3. **Gender Dividend:** Direct promotion of Mahila Samriddhi Yojana (MSY) with special 1.5% interest rebates for women-led SHGs.
4. **Roadmap Extensions:**
   - **Phase 1:** Bhashini Speech-to-Speech API for regional vernacular voice screening.
   - **Phase 2:** Automated 3-page bankable Detailed Project Report (DPR) PDF generator.
   - **Phase 3:** DigiLocker API integration for instant digital verification of Caste & Income certificates.

---

## Slide 8: Summary & Submission Access

- **Live Web Application (Vercel)**: [https://scheme-setu-beryl.vercel.app](https://scheme-setu-beryl.vercel.app)
- **Live Backend API (Render)**: [https://scheme-setu-wccq.onrender.com](https://scheme-setu-wccq.onrender.com)
- **API Health Check**: [https://scheme-setu-wccq.onrender.com/api/health](https://scheme-setu-wccq.onrender.com/api/health)
- **GitHub Repository**: [https://github.com/yashica-tech-flare/scheme-setu](https://github.com/yashica-tech-flare/scheme-setu)
- **Status**: 100% Deployed, Verified & Live for Remote Evaluation.
