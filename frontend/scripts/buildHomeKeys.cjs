const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');

// 1. Add home section to existing complete languages
const homeTranslations = {
  en: {
    problemsBadge: 'Bridging the SC Credit Gap',
    problemsTitle: 'Why Do SC Concessional Applications Fail Today?',
    problemsSubtitle: 'Beneficiaries with family income under ₹5L/year are legally entitled to subsidized capital, but face hurdles:',
    problem1Title: 'Scheme Mismatch',
    problem1Desc: 'Applicants apply for Term Loans when their project fits Micro Finance (≤ ₹1.4L), or miss out on women schemes like Mahila Samriddhi at 5% rate.',
    problem1Solved: 'Solved: Automated rule engine ranks by exact eligibility.',
    problem2Title: 'Wrong Channel Partner Routing',
    problem2Desc: "Submitting files to bank branches that don't handle NSFDC or have exhausted their annual allocation causes months of rejection delays.",
    problem2Solved: 'Solved: Geo-spatial locator filters healthy partners with fund capacity.',
    problem3Title: 'Moratorium & EMI Misunderstanding',
    problem3Desc: 'Borrowers are unaware that concessional loans include 3-12 months grace periods where no principal is due while their business takes off.',
    problem3Solved: 'Solved: Dynamic simulator shows exact savings vs commercial loans.',
    simulatorTitle: 'Interactive Concessional EMI Simulator',
    simulatorSubtitle: 'Simulate your monthly installment with genuine NSFDC subsidized rates and moratorium relief:'
  },
  hi: {
    problemsBadge: 'अनुसूचित जाति ऋण अंतर को पाटना',
    problemsTitle: 'आज अनुसूचित जाति के रियायती ऋण आवेदन क्यों असफल होते हैं?',
    problemsSubtitle: '₹5 लाख/वर्ष से कम पारिवारिक आय वाले लाभार्थी रियायती पूंजी के वैधानिक हकदार हैं, परंतु ये बाधाएं आती हैं:',
    problem1Title: 'योजना असंगतता',
    problem1Desc: 'आवेदक टर्म लोन के लिए आवेदन करते हैं जब उनका काम सूक्ष्म ऋण (≤ ₹1.4 लाख) के योग्य होता है, अथवा 5% वाली महिला समृद्धि योजना चूक जाते हैं।',
    problem1Solved: 'समाधान: स्वचालित नियम प्रणाली सटीक पात्रता के अनुसार योजनाएं निर्धारित करती है।',
    problem2Title: 'गलत चैनल पार्टनर का चयन',
    problem2Desc: 'ऐसी बैंक शाखाओं में आवेदन जमा करना जो एनएसएफडीसी संचालित नहीं करतीं या जिनका वार्षिक कोटा समाप्त हो चुका है, जिससे महीनों की देरी होती है।',
    problem2Solved: 'समाधान: भू-स्थानिक लोकेटर पर्याप्त फंड वाली सक्रिय अधिकृत शाखाएं खोजता है।',
    problem3Title: 'मोरेटोरियम व ईएमआई की गलतफहमी',
    problem3Desc: 'उद्यमी अनभिज्ञ रहते हैं कि रियायती ऋणों में 3-12 महीने की छूट अवधि होती है जिसमें कारोबार शुरू होने तक मूलधन नहीं चुकाना होता।',
    problem3Solved: 'समाधान: गतिशील कैलकुलेटर व्यावसायिक ऋणों की तुलना में सटीक बचत दर्शाता है।',
    simulatorTitle: 'इंटरैक्टिव रियायती ईएमआई कैलकुलेटर',
    simulatorSubtitle: 'वास्तविक एनएसएफडीसी रियायती ब्याज दरों और मोरेटोरियम राहत के साथ अपनी मासिक किस्त की गणना करें:'
  },
  te: {
    problemsBadge: 'ఎస్సీ రుణ వ్యత్యాసాన్ని తగ్గించడం',
    problemsTitle: 'నేడు ఎస్సీ రాయితీ రుణ దరఖాస్తులు ఎందుకు విఫలమవుతున్నాయి?',
    problemsSubtitle: 'వార్షిక కుటుంబ ఆదాయం ₹5 లక్షల లోపు ఉన్న లబ్ధిదారులు రాయితీ మూలధనానికి అర్హులు, కానీ ఈ సమస్యలను ఎదుర్కొంటారు:',
    problem1Title: 'పథకం అసమతుల్యత',
    problem1Desc: 'ప్రాజెక్ట్ సూక్ష్మ రుణం (≤ ₹1.4 లక్షలు) కింద సరిపోలినప్పుడు టర్మ్ లోన్ కోసం దరఖాస్తు చేయడం, లేదా 5% వడ్డీతో మహిళా సమృద్ధి పథకాన్ని కోల్పోవడం.',
    problem1Solved: 'పరిష్కారం: ఆటోమేటెడ్ రూల్ ఇంజిన్ ఖచ్చితమైన అర్హత ఆధారంగా పథకాలను ర్యాంక్ చేస్తుంది.',
    problem2Title: 'తప్పుడు ఛానల్ భాగస్వామి ఎంపిక',
    problem2Desc: 'NSFDC నిధులను నిర్వహించని లేదా వార్షిక కోటా పూర్తయిన బ్యాంకు శాఖలకు దరఖాస్తులను సమర్పించడం వల్ల నెలల తరబడి ఆలస్యం అవుతుంది.',
    problem2Solved: 'పరిష్కారం: జియో-స్పేషియల్ లొకేటర్ నిధుల లభ్యత ఉన్న క్రియాశీల భాగస్వాములను ఫిల్టర్ చేస్తుంది.',
    problem3Title: 'మొరటోరియం & EMI అపార్థాలు',
    problem3Desc: 'వ్యాపారం ప్రారంభ దశలో 3-12 నెలల మొరటోరియం గడువు ఉంటుందని, ఆ సమయంలో అసలు చెల్లించాల్సిన అవసరం లేదని చాలామందికి తెలియదు.',
    problem3Solved: 'పరిష్కారం: డైనమిక్ సిమ్యులేటర్ వాణిజ్య రుణాలతో పోలిస్తే ఖచ్చితమైన పొదుపును లెక్కిస్తుంది.',
    simulatorTitle: 'ఇంటరాక్టివ్ రాయితీ EMI సిమ్యులేటర్',
    simulatorSubtitle: 'అధికారిక NSFDC రాయితీ వడ్డీ రేట్లు మరియు మొరటోరియం సహాయంతో మీ నెలవారీ వాయిదాను లెక్కించండి:'
  },
  ta: {
    problemsBadge: 'பட்டியல் சாதி கடன் இடைவெளியைக் குறைத்தல்',
    problemsTitle: 'இன்று பட்டியல் சாதி கடன் விண்ணப்பங்கள் ஏன் நிராகரிக்கப்படுகின்றன?',
    problemsSubtitle: 'குடும்ப வருமானம் ₹5 லட்சம்/ஆண்டுக்குள் உள்ள பயனாளிகள் சலுகைக் கடனுக்கு தகுதியுடையவர்கள், ஆனால் பல தடைகளை எதிர்கொள்கின்றனர்:',
    problem1Title: 'திட்ட பொருத்தமின்மை',
    problem1Desc: 'திட்டம் குறுங்கடனுக்கு (≤ ₹1.4 லட்சம்) பொருந்தும்போது டேர்ம் லோனுக்கு விண்ணப்பிப்பது அல்லது 5% மகிளா சம்ரித்தி திட்டத்தை தவறவிடுவது.',
    problem1Solved: 'தீர்வு: தானியங்கி விதி இயந்திரம் தகுதிக்கு ஏற்ப முன்னுரிமை திட்டங்களை வரிசைப்படுத்துகிறது.',
    problem2Title: 'தவறான சேனல் பார்ட்னர் தேர்வு',
    problem2Desc: 'NSFDC திட்டங்களை கையாளாத அல்லது நிதி ஒதுக்கீடு முடிந்த வங்கி கிளைகளில் சமர்ப்பிப்பதால் பல மாதங்கள் தாமதம் ஏற்படுகிறது.',
    problem2Solved: 'தீர்வு: புவிசார் லொகேட்டர் நிதி வசதியுள்ள அங்கீகரிக்கப்பட்ட கிளைகளை வடிகட்டுகிறது.',
    problem3Title: 'மொரட்டோரியம் மற்றும் இஎம்ஐ தவறான புரிதல்',
    problem3Desc: 'வணிகம் தொடங்கும் காலத்தில் 3-12 மாதங்கள் வரை அசல் செலுத்த தேவையில்லை என்ற மொரட்டோரியம் சலுகை பலருக்கு தெரிவதில்லை.',
    problem3Solved: 'தீர்வு: வணிக வங்கிகளுடன் ஒப்பிடும்போது கிடைக்கும் துல்லியமான வட்டி சேமிப்பை காட்டுகிறது.',
    simulatorTitle: 'ஊடாடும் சலுகை EMI கால்குலேட்டர்',
    simulatorSubtitle: 'அங்கீகரிக்கப்பட்ட NSFDC சலுகை வட்டி விகிதங்கள் மற்றும் மொரட்டோரியத்துடன் மாதாந்திர தவணையை கணக்கிடுங்கள்:'
  },
  bn: {
    problemsBadge: 'তফসিলি জাতি ঋণ ব্যবধান দূরীকরণ',
    problemsTitle: 'আজ কেন তফসিলি জাতিদের ঋণ আবেদন বাতিল হয়?',
    problemsSubtitle: 'বার্ষিক পারিবারিক আয় ₹৫ লক্ষের কম থাকা আবেদনকারীরা ভর্তুকিযুক্ত ঋণের অধিকারী, কিন্তু নানা বাধার সম্মুখীন হন:',
    problem1Title: 'প্রকল্প অমিল',
    problem1Desc: 'প্রকল্প ক্ষুদ্র ঋণের (≤ ₹১.৪ লাখ) উপযুক্ত হওয়া সত্ত্বেও টার্ম লোনের আবেদন করা, অথবা ৫% সুদের মহিলা সমৃদ্ধি যোজনা হাতছাড়া করা।',
    problem1Solved: 'সমাধান: স্বয়ংক্রিয় রুল ইঞ্জিন সঠিক যোগ্যতা অনুযায়ী প্রকল্প সাজায়।',
    problem2Title: 'ভুল চ্যানেল পার্টনার নির্বাচন',
    problem2Desc: 'যে ব্যাংক শাখায় NSFDC প্রকল্প নেই বা বাৎসরিক কোটা শেষ, সেখানে আবেদন জমা দিলে মাসের পর মাস বিলম্ব হয়।',
    problem2Solved: 'সমাধান: জিও-স্প্যাশিয়াল লোকেটার পর্যাপ্ত তহবিলযুক্ত সক্রিয় অংশীদার খুঁজে বের করে।',
    problem3Title: 'মোরেটোরিয়াম ও ইএমআই বিভ্রান্তি',
    problem3Desc: 'ব্যবসা শুরু হতে ৩-১২ মাস কোনো আসল কিস্তি দিতে হয় না—এই মোরেটোরিয়াম সুবিধা সম্পর্কে বহু ঋণগ্রহীতা অজ্ঞাত।',
    problem3Solved: 'সমাধান: বাণিজ্যিক ঋণের তুলনায় সঠিক সাশ্রয় প্রদর্শন করে।',
    simulatorTitle: 'ইন্টারেক্টিভ রেয়াতি ইএমআই ক্যালকুলেটর',
    simulatorSubtitle: 'প্রকৃত NSFDC রেয়াতি সুদের হার এবং মোরেটোরিয়াম সহ আপনার মাসিক কিস্তি গণনা করুন:'
  },
  mr: {
    problemsBadge: 'अनुसूचित जाती कर्ज तफावत दूर करणे',
    problemsTitle: 'आज अनुसूचित जातींचे सवलतीचे कर्ज अर्ज का नाकारले जातात?',
    problemsSubtitle: 'वार्षिक ₹५ लाखांपेक्षा कमी उत्पन्न असलेले लाभार्थी सवलतीच्या कर्जासाठी पात्र आहेत, परंतु अनेक अडचणी येतात:',
    problem1Title: 'योजनेतील विसंगती',
    problem1Desc: 'प्रकल्प सूक्ष्म वित्तासाठी (≤ ₹१.४ लाख) योग्य असताना मुदत कर्जासाठी अर्ज करणे किंवा ५% दराची महिला समृद्धी योजना गमावणे.',
    problem1Solved: 'तोडगा: स्वयंचलित नियम प्रणाली अचूक पात्रतेनुसार योजना क्रमवारी लावते.',
    problem2Title: 'चुकीची बँक शाखा निवडणे',
    problem2Desc: 'ज्या शाखांमध्ये NSFDC चे काम चालत नाही किंवा वार्षिक कोटा संपला आहे तेथे अर्ज केल्यास महिन्यांचा विलंब होतो.',
    problem2Solved: 'तोडगा: जिओ-स्पेशिअल लोकेटर पुरेसा निधी असलेल्या अधिकृत शाखा शोधतो.',
    problem3Title: 'मोरेटोरियम व ईएमआय बाबत गैरसमज',
    problem3Desc: 'व्यवसाय सुरू होताना ३ ते १२ महिने मुद्दल भरण्याची सूट (मोरेटोरियम) असते हे अनेकांना ठाऊक नसते.',
    problem3Solved: 'तोडगा: व्यावसायिक बँकांच्या तुलनेत होणारी खरी व्याज बचत दाखवतो.',
    simulatorTitle: 'परस्परसंवादी सवलत ईएमआय कॅल्क्युलेटर',
    simulatorSubtitle: 'अधिकृत NSFDC सवलतीच्या व्याजदरांसह व मोरेटोरियमसह आपल्या मासिक हप्त्याची गणना करा:'
  },
  ur: {
    problemsBadge: 'شیڈول کاسٹ قرض کے فرق کو ختم کرنا',
    problemsTitle: 'آج ایس سی رعایتی قرض کی درخواستیں کیوں مسترد ہوتی ہیں؟',
    problemsSubtitle: '5 لاکھ روپے سالانہ سے کم آمدنی والے درخواست گزار رعایتی سرمائے کے قانونی حقدار ہیں، لیکن رکاوٹوں کا سامنا کرتے ہیں:',
    problem1Title: 'اسکیم کی غلط فہمی',
    problem1Desc: 'پروجیکٹ مائیکرو فنانس (1.4 لاکھ تک) کا ہو لیکن ٹرم لون کی درخواست دینا، یا 5 فیصد والی مہیلا سمردھی اسکیم سے محروم رہنا۔',
    problem1Solved: 'حل: خودکار رول انجن درست اہلیت کے مطابق اسکیمیں ترتیب دیتا ہے۔',
    problem2Title: 'غلط پارٹنر برانچ کا انتخاب',
    problem2Desc: 'ایسی بینک برانچوں میں فائل جمع کرانا جہاں این ایس ایف ڈی سی کا کام نہیں ہوتا یا کوٹہ ختم ہوچکا ہے، مہینوں تاخیر کا سبب بنتا ہے۔',
    problem2Solved: 'حل: جیو اسپیٹل لوکیٹر فنڈ صلاحیت والی منظور شدہ شاخیں تلاش کرتا ہے۔',
    problem3Title: 'موریٹوریم اور ای ایم آئی کی غلط فہمی',
    problem3Desc: 'قرض لینے والوں کو یہ معلوم نہیں ہوتا کہ کاروبار شروع ہونے تک 3 سے 12 ماہ اصل رقم کی چھوٹ (موریٹوریم) حاصل ہوتی ہے۔',
    problem3Solved: 'حل: ڈائنامک سمیلیٹر کمرشل بینکوں کے مقابلے میں حقیقی بچت دکھاتا ہے۔',
    simulatorTitle: 'انٹرایکٹو رعایتی ای ایم آئی کیلکولیٹر',
    simulatorSubtitle: 'حقیقی این ایس ایف ڈی سی رعایتی شرح سود اور موریٹوریم کے ساتھ اپنی ماہانہ قسط کا حساب لگائیں:'
  }
};

// Apply home section to complete languages
for (const [code, home] of Object.entries(homeTranslations)) {
  const commonFile = path.join(localesDir, code, 'common.json');
  if (fs.existsSync(commonFile)) {
    const json = JSON.parse(fs.readFileSync(commonFile, 'utf8'));
    json.home = home;
    fs.writeFileSync(commonFile, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Updated home section in ${code}/common.json`);
  }
}
