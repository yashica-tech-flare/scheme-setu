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

| Language | Model & Config | Spoken Text in Native Script | Native Speaker Name | Speaks Right Language? (Y/N) | Pronunciation OK? (Y/N) | Notes & Date |
|:---|:---|:---|:---|:---:|:---:|:---|
| **Telugu (`te`)** | ElevenLabs v3 (`te`) | షెడ్యూల్డ్ కులాల వ్యవస్థాపకుల కోసం స్కీమ్‌బ్రిడ్జ్ రాయితీ రుణ పోర్టల్‌కు స్వాగతం. | | | | |
| **Bengali (`bn`)** | ElevenLabs v3 (`bn`) | তপশিলি জাতি উদ্যোক্তাদের জন্য স্কিমব্রিজ রেয়াতি ঋণ পোর্টালে স্বাগতম। | | | | |
| **Gujarati (`gu`)** | ElevenLabs v3 (`gu`) | અનુસૂચિત જાતિના સાહસિકો માટે સ્કીમબ્રિજ રાહત લોન પોર્ટલ પર આપનું સ્વાગત છે. | | | | |
| **Kannada (`kn`)** | ElevenLabs v3 (`kn`) | ಪರಿಶಿಷ್ಟ ಜಾತಿಯ ಉದ್ಯಮಿಗಳಿಗಾಗಿ ಸ್ಕೀಮ್‌ಬ್ರಿಡ್ಜ್ ರಿಯಾಯಿತಿ ಸಾಲದ ಪೋರ್ಟಲ್‌ಗೆ ಸುಸ್ವಾಗತ. | | | | |
| **Malayalam (`ml`)** | ElevenLabs v3 (`ml`) | പട്ടികജാതി സംരംഭകർക്കായുള്ള സ്കീംബ്രിഡ്ജ് വായ്പാ പോർട്ടലിലേക്ക് സ്വാഗതം. | | | | |
| **Punjabi (`pa`)** | ElevenLabs v3 (`pa`) | ਅਨੁਸੂਚਿਤ ਜਾਤੀ ਦੇ ਉੱਦਮੀਆਂ ਲਈ ਸਕੀਮਬ੍ਰਿਜ ਰਿਆਇਤੀ ਕਰਜ਼ਾ ਪੋਰਟਲ ਵਿੱਚ ਸੁਆਗਤ ਹੈ। | | | | |
| **Odia (`or`)** | Sarvam Bulbul v3 / Pending | ଅନୁସୂଚିତ ଜାତି ଉଦ୍ୟୋଗୀଙ୍କ ପାଇଁ ସ୍କିମ୍‌ବ୍ରିଜ୍ ରିହାତି ଋଣ ପୋର୍ଟାଲ୍‌କୁ ସ୍ୱାଗତ। | | | | Unlisted in ElevenLabs v3; requires Sarvam key |
| **Assamese (`as`)** | ElevenLabs v3 (`as`) | অনুসূচীত জাতিৰ উদ্যোগীসকলৰ বাবে স্কিমব্ৰিজ ৰেহাই ঋণ পৰ্টেললৈ স্বাগতম। | | | | |

---

## Review Guidelines for Evaluators
1. **Intelligibility**: Can a first-time, low-literacy listener understand the financial instructions clearly?
2. **Numbers & Amounts**: Are figures like "₹1,40,000" read naturally as words in the local language rather than digit-by-digit or in English?
3. **Accent Authenticity**: Does the voice sound like an authentic native speaker of the language, or does it sound like a foreign/Hindi accent reading transliterated text?
4. **Action**: If any language fails, report to engineering immediately to mark status as `unavailable`.
