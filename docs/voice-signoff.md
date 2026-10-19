# SchemeBridge — Multilingual Voice Assistant Human Sign-off Sheet

> **Important**: Spoken language and acoustic pronunciation cannot be verified by automated tools.
> All regional Indian languages must be listened to and signed off by a native speaker before graduating from **Beta** to **Verified**.
> If any language speaks the wrong dialect, wrong language, or mispronounces loan terms, it must be marked `N` and kept `unavailable`.

---

## 1. Frozen Languages (Verified Baseline)

These 5 languages were confirmed working and signed off on the live site. Their audio files and hashes are strictly frozen.

| Language | Model & Voice | Sample Native Script Sentence | Native Speaker Sign-off | Speaks Right Language? | Pronunciation OK? | Notes |
|:---|:---|:---|:---|:---:|:---:|:---|
| **English (`en`)** | ElevenLabs Multilingual v2 (Sarah) | Welcome to SchemeBridge concessional credit portal for Scheduled Caste entrepreneurs. | Live Verified | Y | Y | Baseline frozen |
| **Hindi (`hi`)** | ElevenLabs Multilingual v2 (Sarah) | अनुसूचित जाति उद्यमियों के लिए योजना सेतु रियायती ऋण पोर्टल में आपका स्वागत है। | Live Verified | Y | Y | Baseline frozen |
| **Tamil (`ta`)** | ElevenLabs Multilingual v2 (Sarah) | பட்டியலின தொழில்முனைவோருக்கான திட்ட சேது சலுகை கடன் தளத்திற்கு உங்களை வரவேற்கிறோம். | Live Verified | Y | Y | Baseline frozen |
| **Marathi (`mr`)** | ElevenLabs Multilingual v2 (Sarah) | अनुसूचित जातीच्या उद्योजकांसाठी योजना सेतू सवलतीच्या कर्ज पोर्टलवर आपले स्वागत आहे. | Live Verified | Y | Y | Baseline frozen |
| **Urdu (`ur`)** | ElevenLabs Multilingual v2 (Charlie) | درج فہرست ذات کے کاروباری افراد کے لیے اسکیم سیتو رعایتی قرض پورٹل میں خوش آمدید۔ | Live Verified | Y | Y | Baseline frozen |

---

## 2. Regional Languages (Target Languages Under Review)

These 7 languages have been synthesized using **Sarvam Bulbul v3** (`bulbul:v3`, speaker `shubh`) and verified via automated script purity (>=90%) and round-trip Speech-to-Text via Sarvam Saaras v4 (`saaras:v4`).
Status is **Beta** awaiting native speaker audition.
Assamese (`as`) remains **Unavailable** because Sarvam does not support it (Golden Rule: no unverified audio or English/Hindi fallback).

> **Acoustic Notice:** Automation passes technical checks; pronunciation is **NOT VERIFIED** until a native speaker signs off below.

| Language | Engine & Voice | Clip Target | Status | STT Script % | STT Word Match % | Speaks Right Language? (Y/N) | Pronunciation OK? (Y/N) | Native Auditor Sign-off |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **Telugu (`te`)** | Sarvam Bulbul v3 (`te-IN`, Shubh) | `/audio/te/portal_welcome.*.mp3` | **Beta** | 100.0% | 77.8% | Pending | Pending | — |
| **Bengali (`bn`)** | Sarvam Bulbul v3 (`bn-IN`, Shubh) | `/audio/bn/portal_welcome.*.mp3` | **Beta** | 100.0% | 100.0% | Pending | Pending | — |
| **Gujarati (`gu`)** | Sarvam Bulbul v3 (`gu-IN`, Shubh) | `/audio/gu/portal_welcome.*.mp3` | **Beta** | 100.0% | 100.0% | Pending | Pending | — |
| **Kannada (`kn`)** | Sarvam Bulbul v3 (`kn-IN`, Shubh) | `/audio/kn/portal_welcome.*.mp3` | **Beta** | 100.0% | 62.5% | Pending | Pending | — |
| **Malayalam (`ml`)** | Sarvam Bulbul v3 (`ml-IN`, Shubh) | `/audio/ml/portal_welcome.*.mp3` | **Beta** | 100.0% | 83.3% | Pending | Pending | — |
| **Punjabi (`pa`)** | Sarvam Bulbul v3 (`pa-IN`, Shubh) | `/audio/pa/portal_welcome.*.mp3` | **Beta** | 100.0% | 91.7% | Pending | Pending | — |
| **Odia (`or`)** | Sarvam Bulbul v3 (`od-IN`, Shubh) | `/audio/or/portal_welcome.*.mp3` | **Beta** | 100.0% | 66.7% | Pending | Pending | — |
| **Assamese (`as`)** | None (Sarvam does not list `as`) | (none) | **Unavailable** | N/A | N/A | N/A | N/A | Disabled (safe mode) |

---

## Review Guidelines for Evaluators
1. **Intelligibility**: Can a first-time, low-literacy listener understand the financial instructions clearly?
2. **Numbers & Amounts**: Are figures like "₹1,40,000" read naturally as words in the local language rather than digit-by-digit or in English?
3. **Accent Authenticity**: Does the voice sound like an authentic native speaker of the language, or does it sound like a foreign/Hindi accent reading transliterated text?
4. **Action**: If any language fails, report to engineering immediately to mark status as `unavailable`.
