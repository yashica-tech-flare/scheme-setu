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

Until a row is signed below, the language remains **Beta** or **Unavailable**.
*The Golden Rule: A wrong-language voice is worse than no voice. If unverified, the button is disabled.*

| Language | Engine & Voice | Clip Target | Status | Speaks Right Language? (Y/N) | Pronunciation OK? (Y/N) | Blocker / Owner Action Required |
|:---|:---|:---|:---|:---:|:---:|:---|
| **Telugu (`te`)** | Sarvam Bulbul v3 (`te-IN`, Shubh) / ElevenLabs v3 (`te`) | `portal_welcome` | unavailable | — | — | ElevenLabs quota exhausted (3 credits left). Add `SARVAM_API_KEY` to Render dashboard or add ElevenLabs credits. |
| **Bengali (`bn`)** | Sarvam Bulbul v3 (`bn-IN`, Shubh) / ElevenLabs v3 (`bn`) | `portal_welcome` | unavailable | — | — | ElevenLabs quota exhausted (3 credits left). Add `SARVAM_API_KEY` to Render dashboard or add ElevenLabs credits. |
| **Gujarati (`gu`)** | Sarvam Bulbul v3 (`gu-IN`, Shubh) / ElevenLabs v3 (`gu`) | `portal_welcome` | unavailable | — | — | ElevenLabs quota exhausted (3 credits left). Add `SARVAM_API_KEY` to Render dashboard or add ElevenLabs credits. |
| **Kannada (`kn`)** | Sarvam Bulbul v3 (`kn-IN`, Shubh) / ElevenLabs v3 (`kn`) | `portal_welcome` | unavailable | — | — | ElevenLabs quota exhausted (3 credits left). Add `SARVAM_API_KEY` to Render dashboard or add ElevenLabs credits. |
| **Malayalam (`ml`)** | Sarvam Bulbul v3 (`ml-IN`, Shubh) / ElevenLabs v3 (`ml`) | `portal_welcome` | unavailable | — | — | ElevenLabs quota exhausted (3 credits left). Add `SARVAM_API_KEY` to Render dashboard or add ElevenLabs credits. |
| **Punjabi (`pa`)** | Sarvam Bulbul v3 (`pa-IN`, Shubh) / ElevenLabs v3 (`pa`) | `portal_welcome` | unavailable | — | — | ElevenLabs quota exhausted (3 credits left). Add `SARVAM_API_KEY` to Render dashboard or add ElevenLabs credits. |
| **Odia (`or`)** | Sarvam Bulbul v3 (`od-IN`, Shubh) | `portal_welcome` | unavailable | — | — | Not supported by ElevenLabs v3. Sarvam is the only route. Add `SARVAM_API_KEY` in Render dashboard. |
| **Assamese (`as`)** | ElevenLabs v3 (`as`) | `portal_welcome` | unavailable | — | — | Not supported by Sarvam. ElevenLabs v3 quota exhausted. Upgrade ElevenLabs plan or add credits at elevenlabs.io. |

---

## Review Guidelines for Evaluators
1. **Intelligibility**: Can a first-time, low-literacy listener understand the financial instructions clearly?
2. **Numbers & Amounts**: Are figures like "₹1,40,000" read naturally as words in the local language rather than digit-by-digit or in English?
3. **Accent Authenticity**: Does the voice sound like an authentic native speaker of the language, or does it sound like a foreign/Hindi accent reading transliterated text?
4. **Action**: If any language fails, report to engineering immediately to mark status as `unavailable`.
