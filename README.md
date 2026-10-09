# Scheme Setu (योजना सेतु) — NSFDC Concessional Credit Portal

> **Live Web App**: [https://scheme-setu-beryl.vercel.app](https://scheme-setu-beryl.vercel.app)  
> **Backend Live API**: [https://scheme-setu-wccq.onrender.com](https://scheme-setu-wccq.onrender.com)  
> **API Health Check**: [https://scheme-setu-wccq.onrender.com/api/health](https://scheme-setu-wccq.onrender.com/api/health)  
> **GitHub Repository**: [https://github.com/yashica-tech-flare/scheme-setu](https://github.com/yashica-tech-flare/scheme-setu)

---

## 🎯 Project Overview

**Scheme Setu (योजना सेतु)** is an AI-assisted, citizen-centric financial enablement portal designed to connect Scheduled Caste (SC) entrepreneurs, artisans, and students with official concessional loan schemes from the **National Scheduled Castes Finance and Development Corporation (NSFDC)** under the Ministry of Social Justice and Empowerment (MoSJE), Government of India.

The platform eliminates high application rejection rates and informational asymmetry by offering:
1. **Rule-Based Eligibility Evaluation**: Deterministic matching with transparent, verifiable match reasons and zero hallucinations.
2. **Moratorium-Aware Financial Simulator**: Precise EMI calculations factoring in principal repayment holidays (moratorium) versus market commercial bank rates (15% p.a.).
3. **Application Guide & Document Checklist**: Step-by-step guidance, downloadable Detailed Project Report (DPR) formats, and a pre-formatted Application Slip.
4. **Geo-Spatial Partner Locator**: Interactive OpenStreetMap locator displaying 35+ verified channel partners (State SC Corporations, Public Sector Banks, Regional Rural Banks, and empanelled NBFC-MFIs) across 21 Indian cities, filtering out high-NPA or exhausted-fund branches.
5. **Full Bilingual Support**: Complete English and Hindi (हिन्दी) localization with instantaneous language toggling.

---

## 🏛️ Structured NSFDC Scheme Knowledge Base

Every scheme in Scheme Setu is mapped directly to official NSFDC guidelines:

| Scheme Name | Loan Ceiling | Concessional Rate | Tenure & Moratorium | Target Beneficiary | Authorized Channelizing Agencies | Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mahila Samriddhi Yojana (MSY)** | ₹1,40,000 | **4% – 5% p.a.** | 48 mo (6 mo grace) | SC Women Entrepreneurs / SHGs | SCA, RRB, NBFC-MFI | [NSFDC Portal](https://nsfdc.nic.in/scheme) |
| **Micro Credit Finance (MCF)** | ₹1,40,000 | **6.5% p.a.** | 36 mo (3 mo grace) | Artisans, Hawkers, Petty Trades | SCA, RRB, NBFC-MFI | [NSFDC Portal](https://nsfdc.nic.in/scheme) |
| **Laghu Vyavsay Yojana (LVY)** | ₹5,00,000 | **7.0% p.a.** | 60 mo (6 mo grace) | Small & Micro Enterprises | SCA, PSB, RRB | [NSFDC Portal](https://nsfdc.nic.in/scheme) |
| **Green Business Scheme (GBS)** | ₹30,00,000 | **7.5% p.a.** | 84 mo (6 mo grace) | Solar, E-Rickshaws, Waste Mgmt | SCA, PSB | [NSFDC Portal](https://nsfdc.nic.in/scheme) |
| **NSFDC Term Loan Scheme** | ₹50,00,000 | **9.0% p.a.** | 120 mo (9 mo grace) | MSME Manufacturing & Transport | SCA, PSB | [NSFDC Portal](https://nsfdc.nic.in/scheme) |
| **NSFDC Education Loan Scheme (ELS)** | ₹20,00,000 | **7.0% p.a.** *(6.5% for women)* | 120 mo (12 mo grace) | Higher & Technical Education | SCA, PSB | [NSFDC Portal](https://nsfdc.nic.in/scheme) |
| **Voctech & Skill Development Loan** | ₹3,00,000 | **6.5% p.a.** | 48 mo (6 mo grace) | NSQF Certified Skill Trades | SCA, RRB, NBFC-MFI | [NSFDC Portal](https://nsfdc.nic.in/scheme) |

---

## 📍 Verified Channel Partner Network

Scheme Setu maps **35 verified institutional branch locations** across 21 cities and 16 states/UTs:
- **SCAs (State Channelising Agencies)**: TAHDCO (Tamil Nadu), DSFDC (Delhi), UPSCFDC (Uttar Pradesh), MPBCDC (Maharashtra), GSCDC (Gujarat), Anuja Nigam (Rajasthan), TSCCDC (Telangana), APSCCFC (Andhra Pradesh), KSDC (Kerala), WBSCSTDFC (West Bengal), OSFDC (Odisha), PSCFC (Punjab), Assam SC Corp.
- **PSBs (Public Sector Banks)**: Indian Overseas Bank, State Bank of India, Punjab National Bank, Bank of Baroda, Canara Bank, Union Bank of India, UCO Bank.
- **RRBs (Regional Rural Banks)**: Tamil Nadu Grama Bank, Karnataka Gramin Bank, Baroda UP Bank, Baroda Rajasthan Kshetriya Gramin Bank, Kerala Gramin Bank.
- **NBFC-MFIs**: Belstar Microfinance Ltd, Fusion Micro Finance, Muthoot Microfin, Satin Creditcare.

---

## 🛠️ Architecture & Tech Stack

```
Frontend (Vercel)
  ├── React 18 + Vite
  ├── TailwindCSS (Vanilla utility styling)
  ├── Leaflet & React-Leaflet (OpenStreetMap Geo-Spatial Tiles)
  ├── i18next (English & हिन्दी Localization)
  └── Lucide React Icons
        │
        ▼ HTTP REST (Axios with Render cold-start resilience & local fallback)
Backend API (Render)
  ├── Node.js & Express
  ├── Haversine Distance Util (Geo-proximity sorting)
  ├── Health Checks & NPA Risk Filtering
  └── Dual Data Layer (MongoDB Atlas Cluster + Embedded Seed Store)
        │
        ▼
Database (MongoDB Atlas)
  ├── `schemes` (7 official NSFDC schemes)
  └── `partners` (35 verified channel partners with geo-coordinates)
```

---

## 🚀 Local Development Setup

### 1. Backend Server
```bash
cd backend
npm install
node src/server.js
# API running on http://localhost:5000
```

### 2. Frontend Development Server
```bash
cd frontend
npm install
npm run dev
# Vite dev server running on http://localhost:5173
```

### 3. Production Build
```bash
cd frontend
npm run build
```

---

## 🛡️ Governance & Disclaimer

Scheme Setu is designed as a public-good digital interface conforming to the official guidelines of the National Scheduled Castes Finance and Development Corporation (NSFDC). The platform assists applicants in discovering suitable credit schemes and nearest empanelled credit partners; sanction and disbursement remain the statutory domain of the respective channelizing agency or partner bank.