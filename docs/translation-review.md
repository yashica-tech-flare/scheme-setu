# SchemeBridge — Translation & Localization Review Log

**Version:** 1.0.0  
**Date:** October 19, 2026  
**Auditor Policy:** All non-native translated terms for regional Indian languages are catalogued here for native speaker verification.  
**Strict Rule:** Spoken language and pronunciation are NOT VERIFIED until a native speaker listens. Similarly, official terminology across the 12 languages must be reviewed by native speakers to ensure cultural nuance and statutory terminology alignment.

---

## 1. Active Language Matrix (12 Constitutional Languages)

1. **English (`en`)**: Verified Baseline
2. **Hindi (`hi`)**: Verified Baseline
3. **Tamil (`ta`)**: Verified Baseline
4. **Marathi (`mr`)**: Verified Baseline
5. **Urdu (`ur`)**: Verified Baseline
6. **Telugu (`te`)**: Beta (Automated STT + Rule-Based) // TODO native review
7. **Bengali (`bn`)**: Beta (Automated STT + Rule-Based) // TODO native review
8. **Gujarati (`gu`)**: Beta (Automated STT + Rule-Based) // TODO native review
9. **Kannada (`kn`)**: Beta (Automated STT + Rule-Based) // TODO native review
10. **Malayalam (`ml`)**: Beta (Automated STT + Rule-Based) // TODO native review
11. **Punjabi (`pa`)**: Beta (Automated STT + Rule-Based) // TODO native review
12. **Odia (`or`)**: Beta (Automated STT + Rule-Based) // TODO native review

---

## 2. Scheme Titles Under Review

| Scheme Code | English | Tamil (`ta`) | Telugu (`te`) | Bengali (`bn`) | Gujarati (`gu`) | Kannada (`kn`) | Malayalam (`ml`) | Punjabi (`pa`) | Odia (`or`) | Urdu (`ur`) | Status |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---:|
| `msy` | Mahila Samriddhi Yojana (MSY) | மகிளா சம்ரித்தி யோஜனா (MSY) | మహిళా సమృద్ధి యోజన (MSY) | মহিলা সমৃদ্ধি যোজনা (MSY) | મહિલા સમૃદ્ધિ યોજના (MSY) | ಮಹಿಳಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ (MSY) | മഹിളാ സമൃദ്ധി യോജന (MSY) | ਮਹਿਲਾ ਸਮ੍ਰਿਧੀ ਯੋਜਨਾ (MSY) | ମହିଳା ସମୃଦ୍ଧି ଯୋଜନା (MSY) | مہیلا سمردھی یوجنا (MSY) | // TODO native review |
| `mcf` | Micro Credit Finance (MCF) | மைக்ரோ கிரெடிட் ஃபைனான்ஸ் (MCF) | మైక్రో క్రెడిట్ ఫైనాన్స్ (MCF) | মাইক্রো ক্রেডিট ফিনান্স (MCF) | માઇક્રો ક્રેડિટ ફાઇનાન્સ (MCF) | ಮೈಕ್ರೋ ಕ್ರೆಡಿಟ್ ಫೈನಾನ್ಸ್ (MCF) | മൈക്രോ ക്രെഡിറ്റ് ഫിനാൻസ് (MCF) | ਮਾਈਕ੍ਰੋ ਕ੍ਰੈਡਿਟ ਫਾਈਨਾਂਸ (MCF) | ମାଇକ୍ରୋ କ୍ରେଡିଟ୍ ଫାଇନାନ୍ସ (MCF) | مائیکرو کریڈٹ فنانس (MCF) | // TODO native review |
| `term` | Term Loan Scheme (TLS) | டேர்ம் லோன் திட்டம் (TLS) | టర్మ్ లోన్ పథకం (TLS) | টার্ম লোন প্রকল্প (TLS) | ટર્મ લોન યોજના (TLS) | ಟರ್ಮ್ ಲೋನ್ ಯೋಜನೆ (TLS) | ടേം ലോൺ പദ്ധതി (TLS) | ਟਰਮ ਲੋਨ ਯੋਜਨਾ (TLS) | ଟର୍ମ ଋଣ ଯୋଜନା (TLS) | ٹرم لون اسکیم (TLS) | // TODO native review |
| `education` | Education Loan Scheme (EL) | கல்விக் கடன் திட்டம் (EL) | విద్యా రుణ పథకం (EL) | শিক্ষা ঋণ প্রকল্প (EL) | શિક્ષણ લોન યોજના (EL) | ಶಿಕ್ಷಣ ಸಾಲ ಯೋಜನೆ (EL) | വിദ്യാഭ്യാസ വായ്പാ പദ്ധതി (EL) | ਸਿੱਖਿਆ ਕਰਜ਼ਾ ਯੋਜਨਾ (EL) | ଶିକ୍ଷା ଋଣ ଯୋଜନା (EL) | تعلیمی قرض اسکیم (EL) | // TODO native review |
| `green` | Green Business Scheme (GBS) | கிரீன் பிசினஸ் திட்டம் (GBS) | గ్రీన్ బిజినెస్ పథకం (GBS) | গ্রিন বিজনেস প্রকল্প (GBS) | ગ્રીન બિઝનેસ યોજના (GBS) | ಗ್ರೀನ್ ಬಿಸಿನೆಸ್ ಯೋಜನೆ (GBS) | ഗ്രീൻ ബിസിനസ് പദ്ധതി (GBS) | ਗ੍ਰੀਨ ਬਿਜ਼ਨਸ ਯੋਜਨਾ (GBS) | ଗ୍ରୀନ୍ ବିଜନେସ୍ ଯୋଜନା (GBS) | گرین بزنس اسکیم (GBS) | // TODO native review |
| `laghu` | Laghu Vyavasay Yojana (LVY) | சிறு வணிகத் திட்டம் (LVY) | చిన్న వ్యాపార పథకం (LVY) | ক্ষুদ্র ব্যবসা প্রকল্প (LVY) | લઘુ વ્યવસાય યોજના (LVY) | ಲಘು ವ್ಯವಸಾಯ ಯೋಜನೆ (LVY) | ലഘു ബിസിനസ് പദ്ധതി (LVY) | ਲਘੂ ਵਪਾਰ ਯੋਜਨਾ (LVY) | ଲଘୁ ବ୍ୟବସାୟ ଯୋଜନା (LVY) | لگھو ویاوسائے یوجنا (LVY) | // TODO native review |
| `voctech` | Voctech & Skill Development Loan | தொழில்நுட்ப மற்றும் திறன் மேம்பாட்டுக் கடன் (Voctech) | వొక్‌టెక్ & నైపుణ్యాభివృద్ధి రుణం (Voctech) | ভকটেক ও দক্ষতা উন্নয়ন ঋণ (Voctech) | વોકટેક અને કૌશલ્ય વિકાસ લોન (Voctech) | ವೊಕ್‌ಟೆಕ್ ಮತ್ತು ಕೌಶಲ್ಯ ಅಭಿವೃದ್ಧಿ ಸಾಲ (Voctech) | വോക്ക്‌ടെക് & നൈപുണ്യ വികസന വായ്പ (Voctech) | ਵੋਕਟੈਕ ਅਤੇ ਹੁਨਰ ਵਿਕਾਸ ਕਰਜ਼ਾ (Voctech) | ଭକଟେକ୍ ଓ ଦକ୍ଷତା ବିକାଶ ଋଣ (Voctech) | وکٹیک اور ہنر کے فروغ کا قرض (Voctech) | // TODO native review |

---

## 3. UI Badges & Functional Labels

| Label Key | English Baseline | Tamil (`ta`) | Telugu (`te`) | Bengali (`bn`) | Gujarati (`gu`) | Kannada (`kn`) | Malayalam (`ml`) | Punjabi (`pa`) | Odia (`or`) | Urdu (`ur`) | Status |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---:|
| `badgeConcessional` | NSFDC Concessional Scheme | NSFDC சலுகைத் திட்டம் | NSFDC రాయితీ పథకం | NSFDC সুবিধাযুক্ত প্রকল্প | NSFDC રાહત દરે યોજના | NSFDC ರಿಯಾಯಿತಿ ಯೋಜನೆ | NSFDC ഇളവ് പദ്ധതി | NSFDC ਰਿਆਇਤੀ ਸਕੀਮ | NSFDC ରିହାତି ଯୋଜନା | NSFDC رعایتی اسکیم | // TODO native review |
| `badgeWomenOnly` | Women Only (MSY) | மகளிர் மட்டும் (MSY) | మహిళలకు మాత్రమే (MSY) | শুধুমাত্র মহিলাদের জন্য (MSY) | માત્ર મહિલાઓ માટે (MSY) | ಮಹಿಳೆಯರಿಗೆ ಮಾತ್ರ (MSY) | വനിതകൾക്ക് മാത്രം (MSY) | ਸਿਰਫ਼ ਔਰਤਾਂ ਲਈ (MSY) | କେବଳ ମହିଳାମାନଙ୍କ ପାଇଁ (MSY) | صرف خواتین کے لیے (MSY) | // TODO native review |
| `category_micro` | Micro Finance | நுண்கடன் | సూక్ష్మ రుణాలు | ক্ষুদ্র ঋণ | સૂક્ષ્મ ધિરાણ | ಕಿರು ಸಾಲ | മൈക്രോ ഫിനാൻസ് | ਮਾਈਕ੍ਰੋ ਫਾਈਨਾਂਸ | କ୍ଷୁଦ୍ର ଋଣ | مائیکرو فنانس | // TODO native review |
| `category_term` | Term Loan | டேர்ம் லோன் | టర్మ్ లోన్ | মেয়াদী ঋণ | ટર્મ લોન | ಟರ್ಮ್ ಲೋನ್ | ടേം ലോൺ | ਟਰਮ ਕਰਜ਼ਾ | ଟର୍ମ ଋଣ | ٹرم لون | // TODO native review |
| `verifySource` | Verify Source | ஆதாரத்தை சரிபார்க்கவும் | మూలాన్ని ధృవీకరించండి | উৎস যাচাই করুন | સત્તાવાર સ્ત્રોત ચકાસો | ಮೂಲವನ್ನು ಪರಿಶೀಲಿಸಿ | ഉറവിടം പരിശോധിക്കുക | ਅਧਿਕਾਰਤ ਸਰੋਤ ਦੀ ਜਾਂਚ ਕਰੋ | ଅଫିସିଆଲ୍ ଉତ୍ସ ଯାଞ୍ଚ କରନ୍ତୁ | سرکاری ماخذ کی تصدیق کریں | // TODO native review |
| `viewOfficialPortal` | View Official Portal | அதிகாரப்பூர்வ தளத்தைக் காண்க | అధికారిక పోర్టల్ చూడండి | অফিসিয়াল পোর্টাল দেখুন | સત્તાવાર પોર્ટલ જુઓ | ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ವೀಕ್ಷಿಸಿ | ഔദ്യോഗിക പോർട്ടൽ കാണുക | ਸਰਕਾਰੀ ਪੋਰਟਲ ਵੇਖੋ | ସରକାରୀ ପୋର୍ଟାଲ୍ ଦେଖନ୍ତୁ | سرکاری پورٹل دیکھیں | // TODO native review |
| `pa` | p.a. | ஆண்டுக்கு | సంవత్సరానికి | বার্ষিক | વાર્ષિક | ವಾರ್ಷಿಕ | പ്രതിവർഷം | ਸਾਲਾਨਾ | ବାର୍ଷିକ | سالانہ | // TODO native review |
