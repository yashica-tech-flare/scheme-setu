const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../src/locales');
const langs = fs.readdirSync(localesDir).filter(f => fs.statSync(path.join(localesDir, f)).isDirectory());

const TRANSLATIONS = {
  en: {
    applyOnlineState: "Apply Online ({{state}} Portal)",
    applyOnlineNational: "Apply on National Portal (PM-SURAJ)",
    findNearestBranch: "Find Nearest Branch",
    printSlip: "Print Verification Slip",
    getDirections: "Get Directions",
    callBranch: "Call Branch",
    nearestBranchTitle: "Nearest Designated Channel Partner",
    offlineBranchExplanation: "This scheme is applied for in person at the agency branch.",
    statePortalsAvailable: "State Portals Available",
    filterByState: "Filter by State / UT",
    allIndia: "All India (National)"
  },
  hi: {
    applyOnlineState: "ऑनलाइन आवेदन ({{state}} पोर्टल)",
    applyOnlineNational: "राष्ट्रीय पोर्टल पर आवेदन करें (पीएम-सूरज)",
    findNearestBranch: "निकटतम शाखा खोजें",
    printSlip: "सत्यापन पर्ची प्रिंट करें",
    getDirections: "दिशा-निर्देश (गूगल मैप्स)",
    callBranch: "शाखा को कॉल करें",
    nearestBranchTitle: "निकटतम नामित चैनल पार्टनर",
    offlineBranchExplanation: "इस योजना के लिए एजेंसी शाखा में व्यक्तिगत रूप से आवेदन किया जाता है।",
    statePortalsAvailable: "उपलब्ध राज्य पोर्टल",
    filterByState: "राज्य / केंद्र शासित प्रदेश चुनें",
    allIndia: "अखिल भारतीय (राष्ट्रीय)"
  },
  ta: {
    applyOnlineState: "ஆன்லைனில் விண்ணப்பிக்கவும் ({{state}} போர்டல்)",
    applyOnlineNational: "தேசிய போர்ட்டலில் விண்ணப்பிக்கவும் (PM-SURAJ)",
    findNearestBranch: "அருகிலுள்ள கிளையைக் கண்டறியவும்",
    printSlip: "சரிபார்ப்பு சீட்டை அச்சிடவும்",
    getDirections: "வழிகாட்டுதல்கள் (கூகிள் மேப்ஸ்)",
    callBranch: "கிளையை அழைக்கவும்",
    nearestBranchTitle: "அருகிலுள்ள அங்கீகரிக்கப்பட்ட சேனல் பார்ட்னர்",
    offlineBranchExplanation: "இந்த திட்டத்திற்கு முகமை கிளையில் நேரில் விண்ணப்பிக்க வேண்டும்.",
    statePortalsAvailable: "கிடைக்கும் மாநில போர்ட்டல்கள்",
    filterByState: "மாநிலம் / யூனியன் பிரதேசம் மூலம் வடிகட்டவும்",
    allIndia: "அனைத்து இந்தியா (தேசிய)"
  },
  te: {
    applyOnlineState: "ఆన్‌లైన్‌లో దరఖాస్తు చేయండి ({{state}} పోర్టల్)",
    applyOnlineNational: "జాతీయ పోర్టల్‌లో దరఖాస్తు చేయండి (PM-SURAJ)",
    findNearestBranch: "సమీప శాఖను కనుగొనండి",
    printSlip: "ధృవీకరణ స్లిప్‌ను ముద్రించండి",
    getDirections: "దిశలు (గూగుల్ మ్యాప్స్)",
    callBranch: "శాఖకు కాల్ చేయండి",
    nearestBranchTitle: "సమీప అధీకృత ఛానల్ భాగస్వామి",
    offlineBranchExplanation: "ఈ పథకానికి ఏజెన్సీ శాఖలో వ్యక్తిగతంగా దరఖాస్తు చేసుకోవాలి.",
    statePortalsAvailable: "అందుబాటులో ఉన్న రాష్ట్ర పోర్టల్స్",
    filterByState: "రాష్ట్రం / యుటి వారీగా ఫిల్టర్ చేయండి",
    allIndia: "అఖిల భారత (జాతీయ)"
  },
  bn: {
    applyOnlineState: "অনলাইনে আবেদন করুন ({{state}} পোর্টাল)",
    applyOnlineNational: "জাতীয় পোর্টালে আবেদন করুন (PM-SURAJ)",
    findNearestBranch: "নিকটতম শাখা খুঁজুন",
    printSlip: "যাচাইকরণ স্লিপ প্রিন্ট করুন",
    getDirections: "দিকনির্দেশ (গুগল ম্যাপস)",
    callBranch: "শাখায় কল করুন",
    nearestBranchTitle: "নিকটতম অনুমোদিত চ্যানেল অংশীদার",
    offlineBranchExplanation: "এই প্রকল্পের জন্য এজেন্সির শাখায় সশরীরে আবেদন করতে হবে।",
    statePortalsAvailable: "উপলব্ধ রাজ্য পোর্টাল",
    filterByState: "রাজ্য / কেন্দ্রশাসিত অঞ্চল নির্বাচন করুন",
    allIndia: "সর্বভারতীয় (জাতীয়)"
  },
  mr: {
    applyOnlineState: "ऑनलाइन अर्ज करा ({{state}} पोर्टल)",
    applyOnlineNational: "राष्ट्रीय पोर्टलवर अर्ज करा (PM-SURAJ)",
    findNearestBranch: "जवळची शाखा शोधा",
    printSlip: "पडताळणी पावती प्रिंट करा",
    getDirections: "दिशा-निर्देश (गुगल मॅप्स)",
    callBranch: "शाखेला कॉल करा",
    nearestBranchTitle: "जवळचे अधिकृत चॅनेल भागीदार",
    offlineBranchExplanation: "या योजनेसाठी एजन्सी शाखेत प्रत्यक्ष जाऊन अर्ज करावा लागतो.",
    statePortalsAvailable: "उपलब्ध राज्य पोर्टल्स",
    filterByState: "राज्य / केंद्रशासित प्रदेश निवडा",
    allIndia: "अखिल भारतीय (राष्ट्रीय)"
  },
  gu: {
    applyOnlineState: "ઓનલાઇન અરજી કરો ({{state}} પોર્ટલ)",
    applyOnlineNational: "રાષ્ટ્રીય પોર્ટલ પર અરજી કરો (PM-SURAJ)",
    findNearestBranch: "નજીકની શાખા શોધો",
    printSlip: "ચકાસણી સ્લિપ પ્રિન્ટ કરો",
    getDirections: "દિશા-નિર્દેશો (ગૂગલ મેપ્સ)",
    callBranch: "શાખાને કૉલ કરો",
    nearestBranchTitle: "નજીકના અધિકૃત ચેનલ ભાગીદાર",
    offlineBranchExplanation: "આ યોજના માટે એજન્સી શાખામાં રૂબરૂ અરજી કરવાની રહેશે.",
    statePortalsAvailable: "ઉપલબ્ધ રાજ્ય પોર્ટલ",
    filterByState: "રાજ્ય / કેન્દ્રશાસિત પ્રદેશ પસંદ કરો",
    allIndia: "અખિલ ભારત (રાષ્ટ્રીય)"
  },
  kn: {
    applyOnlineState: "ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ({{state}} ಪೋರ್ಟಲ್)",
    applyOnlineNational: "ರಾಷ್ಟ್ರೀಯ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ (PM-SURAJ)",
    findNearestBranch: "ಹತ್ತಿರದ ಶಾಖೆಯನ್ನು ಹುಡುಕಿ",
    printSlip: "ಪರಿಶೀಲನಾ ಸ್ಲಿಪ್ ಮುದ್ರಿಸಿ",
    getDirections: "ನಿರ್ದೇಶನಗಳು (ಗೂಗಲ್ ನಕ್ಷೆಗಳು)",
    callBranch: "ಶಾಖೆಗೆ ಕರೆ ಮಾಡಿ",
    nearestBranchTitle: "ಹತ್ತಿರದ ಅಧಿಕೃತ ಚಾನೆಲ್ ಪಾಲುದಾರ",
    offlineBranchExplanation: "ಈ ಯೋಜನೆಗಾಗಿ ಏಜೆನ್ಸಿ ಶಾಖೆಯಲ್ಲಿ ಖುದ್ದಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು.",
    statePortalsAvailable: "ಲಭ್ಯವಿರುವ ರಾಜ್ಯ ಪೋರ್ಟಲ್‌ಗಳು",
    filterByState: "ರಾಜ್ಯ / ಕೇಂದ್ರಾಡಳಿತ ಪ್ರದೇಶ ಆಯ್ಕೆಮಾಡಿ",
    allIndia: "ಅಖಿಲ ಭಾರತ (ರಾಷ್ಟ್ರೀಯ)"
  },
  ml: {
    applyOnlineState: "ഓൺലൈനായി അപേക്ഷിക്കുക ({{state}} പോർട്ടൽ)",
    applyOnlineNational: "ദേശീയ പോർട്ടലിൽ അപേക്ഷിക്കുക (PM-SURAJ)",
    findNearestBranch: "ഏറ്റവും അടുത്തുള്ള ബ്രാഞ്ച് കണ്ടെത്തുക",
    printSlip: "സ്ഥിരീകരണ സ്ലിപ്പ് പ്രിന്റ് ചെയ്യുക",
    getDirections: "വഴികൾ (ഗൂഗിൾ മാപ്സ്)",
    callBranch: "ബ്രാഞ്ചിലേക്ക് വിളിക്കുക",
    nearestBranchTitle: "അംഗീകൃത ചാനൽ പങ്കാളി",
    offlineBranchExplanation: "ഈ പദ്ധതിക്കായി ഏജൻസി ശാഖയിൽ നേരിട്ടെത്തി അപേക്ഷിക്കേണ്ടതാണ്.",
    statePortalsAvailable: "ലഭ്യമായ സംസ്ഥാന പോർട്ടലുകൾ",
    filterByState: "സംസ്ഥാനം / കേന്ദ്രഭരണ പ്രദേശം തിരഞ്ഞെടുക്കുക",
    allIndia: "അഖിലേന്ത്യാ (ദേശീയ)"
  },
  pa: {
    applyOnlineState: "ਆਨਲਾਈਨ ਅਰਜ਼ੀ ਦਿਓ ({{state}} ਪੋਰਟਲ)",
    applyOnlineNational: "ਰਾਸ਼ਟਰੀ ਪੋਰਟਲ 'ਤੇ ਅਰਜ਼ੀ ਦਿਓ (PM-SURAJ)",
    findNearestBranch: "ਨੇੜਲੀ ਬ੍ਰਾਂਚ ਲੱਭੋ" ,
    printSlip: "ਤਸਦੀਕ ਸਲਿੱਪ ਪ੍ਰਿੰਟ ਕਰੋ",
    getDirections: "ਦਿਸ਼ਾ-ਨਿਰਦੇਸ਼ (ਗੂਗਲ ਮੈਪਸ)",
    callBranch: "ਬ੍ਰਾਂਚ ਨੂੰ ਕਾਲ ਕਰੋ",
    nearestBranchTitle: "ਨੇੜਲਾ ਅਧਿਕਾਰਤ ਚੈਨਲ ਪਾਰਟਨਰ",
    offlineBranchExplanation: "ਇਸ ਸਕੀਮ ਲਈ ਏਜੰਸੀ ਬ੍ਰਾਂਚ ਵਿੱਚ ਨਿੱਜੀ ਤੌਰ 'ਤੇ ਅਰਜ਼ੀ ਦਿੱਤੀ ਜਾਂਦੀ ਹੈ।",
    statePortalsAvailable: "ਉਪਲਬਧ ਰਾਜ ਪੋਰਟਲ",
    filterByState: "ਰਾਜ / ਕੇਂਦਰ ਸ਼ਾਸਤ ਪ੍ਰਦੇਸ਼ ਚੁਣੋ",
    allIndia: "ਅਖਿਲ ਭਾਰਤੀ (ਰਾਸ਼ਟਰੀ)"
  },
  or: {
    applyOnlineState: "ଅନଲାଇନ୍ ଆବେଦନ କରନ୍ତୁ ({{state}} ପୋର୍ଟାଲ୍)",
    applyOnlineNational: "ଜାତୀୟ ପୋର୍ଟାଲରେ ଆବେଦନ କରନ୍ତୁ (PM-SURAJ)",
    findNearestBranch: "ନିକଟତମ ଶାଖା ଖୋଜନ୍ତୁ",
    printSlip: "ଯାଞ୍ଚ ସ୍ଲିପ୍ ପ୍ରିଣ୍ଟ୍ କରନ୍ତୁ",
    getDirections: "ଦିଗନିର୍ଦ୍ଦେଶ (ଗୁଗୁଲ୍ ମ୍ୟାପ୍ସ)",
    callBranch: "ଶାଖାକୁ କଲ୍ କରନ୍ତୁ",
    nearestBranchTitle: "ନିକଟତମ ସ୍ୱୀକୃତିପ୍ରାପ୍ତ ଚ୍ୟାନେଲ୍ ସହଯୋଗୀ",
    offlineBranchExplanation: "ଏହି ଯୋଜନା ପାଇଁ ଏଜେନ୍ସି ଶାଖାରେ ସ୍ୱୟଂ ଉପସ୍ଥିତ ରହି ଆବେଦନ କରିବାକୁ ପଡିବ।",
    statePortalsAvailable: "ଉପଲବ୍ଧ ରାଜ୍ୟ ପୋର୍ଟାଲ୍",
    filterByState: "ରାଜ୍ୟ / କେନ୍ଦ୍ରଶାସିତ ଅଞ୍ଚଳ ବାଛନ୍ତୁ",
    allIndia: "ସର୍ବଭାରତୀୟ (ଜାତୀୟ)"
  },
  as: {
    applyOnlineState: "অনলাইনত আবেদন কৰক ({{state}} পৰ্টেল)",
    applyOnlineNational: "ৰাষ্ট্ৰীয় পৰ্টেলত আবেদন কৰক (PM-SURAJ)",
    findNearestBranch: "নিকটতম শাখা বিচাৰক",
    printSlip: "পৰীক্ষণ শ্লিপ প্ৰিণ্ট কৰক",
    getDirections: "দিশ-নিৰ্দেশনা (গুগল মেপ)",
    callBranch: "শাখাত কল কৰক",
    nearestBranchTitle: "নিকটতম অনুমোদিত চেনেল অংশীদাৰ",
    offlineBranchExplanation: "এই আঁচনিৰ বাবে সংস্থাৰ শাখাত ব্যক্তিগতভাৱে আবেদন কৰিব লাগিব।",
    statePortalsAvailable: "উপলব্ধ ৰাজ্যিক পৰ্টেল",
    filterByState: "ৰাজ্য / কেন্দ্ৰীয় শাসিত অঞ্চল বাছক",
    allIndia: "সৰ্বভাৰতীয় (ৰাষ্ট্ৰীয়)"
  },
  ur: {
    applyOnlineState: "آن لائن درخواست ({{state}} پورٹل)",
    applyOnlineNational: "قومی پورٹل پر درخواست دیں (پی ایم-سورج)",
    findNearestBranch: "قریبی برانچ تلاش کریں",
    printSlip: "تصدیقی پرچی پرنٹ کریں",
    getDirections: "راستہ (گوگل میپس)",
    callBranch: "برانچ کو کال کریں",
    nearestBranchTitle: "قریبی مجاز چینل پارٹنر",
    offlineBranchExplanation: "اس اسکیم کے لیے ایجنسی برانچ میں ذاتی طور پر درخواست دی جاتی ہے۔",
    statePortalsAvailable: "دستیاب ریاستی پورٹلز",
    filterByState: "ریاست / یو ٹی کا انتخاب کریں",
    allIndia: "آل انڈیا (قومی)"
  }
};

langs.forEach(lang => {
  const commonPath = path.join(localesDir, lang, 'common.json');
  if (!fs.existsSync(commonPath)) return;

  const data = JSON.parse(fs.readFileSync(commonPath, 'utf8').replace(/^\uFEFF/, ''));
  if (!data.results) data.results = {};

  const dict = TRANSLATIONS[lang] || TRANSLATIONS.hi || TRANSLATIONS.en;

  Object.entries(TRANSLATIONS.en).forEach(([k, defVal]) => {
    data.results[k] = dict[k] || defVal;
  });

  fs.writeFileSync(commonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
});

console.log(`Updated state & branch localization keys across ${langs.length} locales.`);
