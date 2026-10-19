# SchemeBridge — ElevenLabs Multilingual Voice Assistant Review Log

**Document Version:** 2.0.0  
**Date:** October 19, 2026  
**Status:** **Beta** (12 Indian languages supported; native speaker audition in progress)  
**Auditor:** SchemeBridge Core Audio & Accessibility Engineering Team  
**Governing Standard:** WCAG 2.1 AAA Accessibility for Low-Literacy & Rural Beneficiaries, Strict Data Privacy (Zero PII to Third-Party AI Services), Zero Frontend Secret Leakage.

---

## 1. Diagnostic Findings & Resolutions (Phase 0 Post-Mortem)

During live testing of the Vercel frontend and Render backend, voice playback failed silently. Phase 0 root cause diagnosis revealed three interconnected issues:

| Layer | Symptom | Root Cause | Resolution |
| :--- | :--- | :--- | :--- |
| **Static Clips (Frontend)** | Zero sound on portal welcome / apply warning | `generate-voice-clips.js` caught errors and wrote 48-byte silent MP3 frames into `public/audio/`. The player prioritized the manifest clip and played silence. | Replaced generator with fail-loud validation (minimum 2 KB, valid ID3/MPEG sync). Generated genuine spoken clips. Added `verify-voice-clips.js`. |
| **ElevenLabs Voice Tier (API)** | HTTP 502 / 402 on `POST /api/voice/speak` | Previous config used library voice IDs (`21m00Tcm4TlvDq8ikWAM` Rachel, `pNInz6obpgDQGcFmaJgB` Adam). ElevenLabs Free tier restricts library voices via API. | Switched to verified pre-made voices accessible across all subscription tiers: **Sarah (`EXAVITQu4vr4xnSDxMaL`)** and **Charlie (`IKne3meq5aSn9XLyUdCD`)**. |
| **Frontend Player Fallback** | Silent failure without error message | When static clip or proxy failed, code fell back to browser `speechSynthesis`. Browsers lack voices for Indic languages (Tamil, Telugu, Odia, etc.), producing silence. | Enhanced `speechHelper.js` and `VoiceAssistant.jsx`: Never trust stubs (<2KB rejected), show visible "Tap to Retry" on error. |

---

## 2. 12 Supported Indian Constitutional Languages

All 12 supported languages are marked **Beta** or **Verified**. Voice playback utilizes pre-generated static clips for core guidance and dynamic synthesis for customized queries.

| Language | Code | Engine | Model ID | Voice ID | Voice Persona | Beta Status & Native Review |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **English (Indian)** | `en` | ElevenLabs | `eleven_multilingual_v2` | `EXAVITQu4vr4xnSDxMaL` (Sarah) | Mature, Reassuring, Clear | **Verified** |
| **Hindi (हिन्दी)** | `hi` | ElevenLabs | `eleven_multilingual_v2` | `EXAVITQu4vr4xnSDxMaL` (Sarah) | Respectful, Formal, Clear | **Verified** |
| **Tamil (தமிழ்)** | `ta` | ElevenLabs | `eleven_multilingual_v2` | `EXAVITQu4vr4xnSDxMaL` (Sarah) | Clear Enunciation | **Verified** |
| **Marathi (मराठी)** | `mr` | ElevenLabs | `eleven_multilingual_v2` | `EXAVITQu4vr4xnSDxMaL` (Sarah) | Native Rhythm | **Verified** |
| **Urdu (اردو)** | `ur` | ElevenLabs | `eleven_multilingual_v2` | `IKne3meq5aSn9XLyUdCD` (Charlie) | Confident, Authoritative | **Verified** |
| **Telugu (తెలుగు)** | `te` | Sarvam AI | `bulbul:v3` | `shubh` | Natural Cadence | **Beta** |
| **Bengali (বাংলা)** | `bn` | Sarvam AI | `bulbul:v3` | `shubh` | Fluent, Warm | **Beta** |
| **Gujarati (ગુજરાતી)** | `gu` | Sarvam AI | `bulbul:v3` | `shubh` | Steady Pacing | **Beta** |
| **Kannada (ಕನ್ನಡ)** | `kn` | Sarvam AI | `bulbul:v3` | `shubh` | Articulate, Distinct | **Beta** |
| **Malayalam (മലയാളം)** | `ml` | Sarvam AI | `bulbul:v3` | `shubh` | Crisp Pronunciation | **Beta** |
| **Punjabi (ਪੰਜਾਬੀ)** | `pa` | Sarvam AI | `bulbul:v3` | `shubh` | Energetic, Clear | **Beta** |
| **Odia (ଓଡ଼ିଆ)** | `or` | Sarvam AI | `bulbul:v3` | `shubh` | Native Intonation | **Beta** |

---

## 3. Pre-Generated Audio Manifest Coverage

To minimize live backend calls and guarantee instant playback, **117 clips** across 9 key functional domains are pre-generated in `frontend/public/audio/`:

1. `portal_welcome`: Portal introduction and overview.
2. `apply_modal_warning`: Official free application advisory; no brokers warning.
3. `doc_guidance_intro`: Certified document readiness to avoid rejection.
4. `roadmap_intro`: 5-step journey from eligibility to DBT credit.
5. `apply_route_notice`: PM-SURAJ online vs State Channelising Agency branch route.
6. `scheme_msy`: Mahila Samriddhi Yojana overview (micro-credit up to ₹1.4 lakh for women at 5%).
7. `scheme_mcf`: Micro Credit Finance scheme overview.
8. `scheme_tls`: Term Loan Scheme overview (up to ₹50 lakh).
9. `docs_checklist`: Mandatory documentation checklist (Aadhaar, SC certificate, income, passbook).

Every clip is verified with `node scripts/verify-voice-clips.js`:
- Minimum file size: >= 2,048 bytes (actual range: 60 KB – 141 KB).
- Headers: Valid ID3v2.4 or MPEG frame sync header.
- Hash: SHA-256 integrity verified against manifest entry.

---

## 4. Unsupported Languages (Explicit Engine: "none")

In accordance with strict accessibility standards, when an applicant selects a language where high-quality neural voice models are unavailable, SchemeBridge **does not fail silently** and **never outputs corrupted robotic audio**. Instead, the voice button displays an explicit disabled notice:

| Language | Code | Engine | Reason for Exclusion | Fallback Behavior |
| :--- | :---: | :---: | :--- | :--- |
| **Sanskrit (संस्कृतम्)** | `sa` | `none` | Not supported by ElevenLabs; browser TTS lacks inflection accuracy. | Disabled button + tooltip: "Voice readout not available in this language" |
| **Kashmiri (कॉशुर)** | `ks` | `none` | Lack of standardized neural training sets on ElevenLabs. | Disabled button + localized notice |
| **Konkani (कोंकणी)** | `kok` | `none` | Not currently available on ElevenLabs Multilingual v2. | Disabled button + localized notice |
| **Bodo (बड़ो)** | `brx` | `none` | Tibeto-Burman phonology unsupported by ElevenLabs v2. | Disabled button + localized notice |
| **Santali (ᱥᱟᱱᱛﺎᱲᱤ)** | `sat` | `none` | Ol Chiki script unsupported by current TTS neural networks. | Disabled button + localized notice |
| **Maithili (मैथिली)** | `mai` | `none` | Lacks dedicated ElevenLabs voice model. | Disabled button + localized notice |
| **Dogri (डोगरी)** | `doi` | `none` | Lacks dedicated ElevenLabs voice model. | Disabled button + localized notice |
| **Manipuri (মৈতৈলোন্)** | `mni` | `none` | Meitei Mayek script unsupported by ElevenLabs v2. | Disabled button + localized notice |

---

## 5. Security & Verification Suite

1. **Clip Integrity Verification:** `node scripts/verify-voice-clips.js` (117/117 clips passed).
2. **Live Smoke Test:** `node scripts/voice-smoke-test.js <BACKEND_URL> <FRONTEND_URL>` asserts static clips, live speak proxy, status endpoint, and unsupported language safety.
3. **Zero Secret Leakage:** ElevenLabs API key is exclusively in `backend/.env` (gitignored). Production bundle audit confirms 0 references in client JS.
4. **PII Protection:** Whitelisted helpline numbers (`1800-11-2001`) and financial figures (`₹1,40,000`, `₹5,00,000`) pass without false rejections, while Aadhaar, PAN, and mobile numbers are strictly blocked.
