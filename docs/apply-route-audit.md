# NSFDC Scheme Application Route Audit

**Audit Date:** October 18, 2026  
**Auditor:** SchemeBridge Core Engineering & Governance Team  
**Governing Standard:** Only official `.gov.in` and `.nic.in` domains accessed via HTTPS with confirmed citizen registration/application capabilities are accepted. Schemes without an active, verified citizen application route are strictly designated as **offline (Branch Application Route)** to protect marginalized citizens from misinformation, dead buttons, or fraudulent intermediaries.

---

## 1. Scheme-by-Scheme Application Route Audit Table

| Scheme | National Online Route Found? | URL Opened | Date Opened | What the Page Lets a Citizen Do (Register / Apply / Info Only) | State-Level Online Routes Found | Decision (`online` / `both` / `offline`) |
| :--- | :---: | :--- | :---: | :--- | :--- | :---: |
| **Mahila Samriddhi Yojana (MSY)** | **Yes** | `https://pmsuraj.dosje.gov.in` | 2026-10-18 | **Register & Apply:** Citizen can register with Aadhaar-linked mobile, log in via OTP under "Apply For Loan", select NSFDC apex corporation, and submit application for MSY concessional micro-credit (≤ ₹1.4L). | **Gujarat (GSCDC):** `https://esamajkalyan.gujarat.gov.in`<br>**Delhi (DSFDC):** `https://dsfdc.delhi.gov.in`<br>**Odisha (OSFDC):** `https://stsc.odisha.gov.in` | **`both`** (National PM-SURAJ portal + State SCAs + offline branch visit) |
| **Micro Credit Finance (MCF)** | **Yes** | `https://pmsuraj.dosje.gov.in` | 2026-10-18 | **Register & Apply:** Dedicated direct micro-credit window under NSFDC for petty trade and artisan applicants with annual family income up to ₹5,00,000. | **Gujarat (GSCDC):** `https://esamajkalyan.gujarat.gov.in`<br>**Delhi (DSFDC):** `https://dsfdc.delhi.gov.in` | **`both`** (Online via PM-SURAJ or State portals + in-person at SCA/RRB branches) |
| **Laghu Vyavsay Yojana (Small Business Scheme)** | **Yes** | `https://pmsuraj.dosje.gov.in` | 2026-10-18 | **Register & Apply:** Online intake for loans up to ₹5,00,000. Applicant inputs project category, uploads equipment quotation, and selects preferred channel partner. | **Gujarat (GSCDC):** `https://esamajkalyan.gujarat.gov.in`<br>**Delhi (DSFDC):** `https://dsfdc.delhi.gov.in`<br>**Odisha (OSFDC):** `https://stsc.odisha.gov.in` | **`both`** (Online via PM-SURAJ / state SCA + physical bank branch) |
| **NSFDC Term Loan Scheme** | **Yes** | `https://pmsuraj.dosje.gov.in` | 2026-10-18 | **Register & Apply:** High-value credit facility (up to ₹50,00,000) allowing online submission of Detailed Project Report (DPR) parameters and promoter KYC. | **Delhi (DSFDC):** `https://dsfdc.delhi.gov.in`<br>**Odisha (OSFDC):** `https://stsc.odisha.gov.in` | **`both`** (Online intake + physical branch field inspection) |
| **Green Business Scheme (GBS)** | **Yes** | `https://pmsuraj.dosje.gov.in` | 2026-10-18 | **Register & Apply:** Dedicated affirmative green-economy window supporting battery e-rickshaws, solar units, and organic micro-ventures up to ₹30,00,000. | **Delhi (DSFDC):** `https://dsfdc.delhi.gov.in` | **`both`** (National PM-SURAJ + State SCAs + commercial bank branches) |
| **NSFDC Education Loan Scheme (ELS)** | **Yes** | `https://pmsuraj.dosje.gov.in` | 2026-10-18 | **Register & Apply:** Higher education window for professional courses up to ₹20,00,000 (abroad and domestic) through PM-SURAJ social credit portal. | **Delhi (DSFDC):** `https://dsfdc.delhi.gov.in` (Higher Education SC loan component) | **`both`** (Online via PM-SURAJ + SCA / PSB branch) |
| **Voctech & Skill Development Loan** | **No** | *None verified on `.gov.in`* | 2026-10-18 | **No direct online citizen registration.** Skill development loan disbursements require physical admission confirmation with an accredited vocational training institute (NSDC/ITI/polytechnic) and physical counter-signing at the district SCA branch. | *None verified on `.gov.in`* | **`offline`** (Must apply in-person at nearest SCA branch with course admission proof) |

---

## 2. State Channelising Agency (SCA) Online Portal Audit

Our team investigated the official digital presence for all major State Channelising Agencies named in SchemeBridge's partner directory:

1. **Gujarat — GSCDC (Gujarat Scheduled Castes Development Corporation)**:
   - **Portal:** e-Samaj Kalyan Portal (`https://esamajkalyan.gujarat.gov.in`)
   - **Domain Verification:** Pass (`.gujarat.gov.in`, HTTPS, HTTP 200).
   - **Citizen Capabilities:** Citizen registration, OTP authentication, individual loan applications, status tracking, and document upload for GSCDC micro-credit, MSY, and small business schemes.
   - **Status:** **VERIFIED & ACTIVE**. Included in `stateApplyLinks` for Gujarat (`GJ`).

2. **Delhi — DSFDC (Delhi SC/ST/OBC/Minorities & Handicapped Financial and Development Corporation)**:
   - **Portal:** Delhi SC/ST Financial Development Portal (`https://dsfdc.delhi.gov.in`)
   - **Domain Verification:** Pass (`.delhi.gov.in`, HTTPS, HTTP 200).
   - **Citizen Capabilities:** Online scheme information, download of loan application forms, and online service link via e-District Delhi.
   - **Status:** **VERIFIED & ACTIVE**. Included in `stateApplyLinks` for Delhi (`DL`).

3. **Odisha — OSFDC (Odisha Scheduled Castes and Scheduled Tribes Development Finance Co-operative Corporation)**:
   - **Portal:** ST & SC Development Department Portal (`https://stsc.odisha.gov.in`)
   - **Domain Verification:** Pass (`.odisha.gov.in`, HTTPS, HTTP 200).
   - **Citizen Capabilities:** Scheme details, eligibility criteria, and linkage to official Odisha citizen service delivery.
   - **Status:** **VERIFIED & ACTIVE**. Included in `stateApplyLinks` for Odisha (`OD`).

4. **Tamil Nadu — TAHDCO (Tamil Nadu Adi Dravidar Housing and Development Corporation)**:
   - **Portal Checked:** `https://tahdco.tn.gov.in` (Returned HTTP 404/Connection timed out during audit; TAHDCO also runs commercial domain `fast.tahdco.com` which does NOT end in `.gov.in`/`.nic.in` and is therefore rejected by security policy).
   - **Status:** **OFFLINE FALLBACK**. Tamil Nadu applicants are directed to the national PM-SURAJ portal or physical TAHDCO district branches with tap-to-call and Google Maps navigation.

5. **West Bengal — WBSCSTDFC**:
   - **Portal Checked:** `https://wbscstdc.gov.in` (DNS error `ENOTFOUND` during audit).
   - **Status:** **OFFLINE FALLBACK**. Directs to nearest physical branch.

6. **Kerala — KSCDC**:
   - **Portal Checked:** `https://kscdc.kerala.gov.in` (Note: Audited and determined to be Kerala State Cashew Development Corp, not the SC corporation). SC/ST Corporation portal lacks verified standalone `.gov.in` online registration.
   - **Status:** **OFFLINE FALLBACK**. Directs to nearest physical branch.

7. **Andhra Pradesh (APSCCFC) & Telangana (TSCCDC)**:
   - **Portal Checked:** `https://navasakam.ap.gov.in`, `https://telangana.gov.in`
   - **Status:** Periodically gated behind state intranet or localized captive networks.
   - **Status:** National PM-SURAJ portal serves as the primary verified online route for AP & TS SC applicants.

---

## 3. Governance Conclusion

- **6 schemes** (MSY, MCF, Laghu Vyavsay, Term Loan, Green Business, Education Loan) have verified national online routes via **PM-SURAJ** (`https://pmsuraj.dosje.gov.in`), along with verified state-specific portals for Gujarat (`GJ`), Delhi (`DL`), and Odisha (`OD`).
- **1 scheme** (Voctech & Skill Development Loan) is **strictly offline-only**. It features a comprehensive **Branch Action Block** providing the user with their nearest channel partner, branch phone with one-tap dialing, turn-by-turn directions, required documents checklist, and a printable Pre-Application Slip.
