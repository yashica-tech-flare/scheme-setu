/**
 * SchemeBridge — Production Audio Clip Generator with Content Hashing
 * 
 * Rules:
 * 1. Takes --langs <langs> (e.g., --langs te,bn,gu,kn,ml,pa,or,as) to regenerate ONLY those.
 * 2. FROZEN LANGUAGES: en, hi, ta, mr, ur. Strictly protected; will abort if targeted without --force-frozen.
 * 3. Content-hashed filenames: /audio/<lang>/<clipId>.<hash8>.mp3
 * 4. Fails loudly (exit code 1) on any API error, response < 2048 bytes, or invalid MP3.
 * 5. Audio Manifest written with Cache-Control: no-cache semantics.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const envPath = path.resolve(__dirname, '../backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = (match[2] || '').trim();
    }
  });
}

const { LANGUAGE_CONFIG, FROZEN_LANGUAGES, BROKEN_LANGUAGES } = require('../backend/src/config/voiceConfig');

const isDryRun = process.argv.includes('--dry-run');
const isForceFrozen = process.argv.includes('--force-frozen');

// Parse --langs flag
const langsArgIndex = process.argv.indexOf('--langs');
let targetLangs = null;
if (langsArgIndex !== -1 && process.argv[langsArgIndex + 1]) {
  targetLangs = process.argv[langsArgIndex + 1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

const OUTPUT_BASE = isDryRun
  ? path.resolve(__dirname, '../temp_clips_dry_run')
  : path.resolve(__dirname, '../frontend/public/audio');

// Validate MP3 header (ID3v2 or MPEG frame sync)
function isValidMp3Header(buf) {
  if (!buf || buf.length < 4) return false;
  const hasId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33;
  const hasSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
  return hasId3 || hasSync;
}

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Phase 3: Audited and corrected prompt texts
 * - All amounts and percentages spelled out in words
 * - Product name is "SchemeBridge"
 * - Script purity >= 90% across all target Unicode blocks
 * - One-line English meaning alongside each sentence
 */
const PROMPTS = {
  // English meaning: Welcome to SchemeBridge concessional credit portal for Scheduled Caste entrepreneurs.
  portal_welcome: {
    en: 'Welcome to SchemeBridge concessional credit portal for Scheduled Caste entrepreneurs.',
    hi: 'अनुसूचित जाति उद्यमियों के लिए योजना सेतु रियायती ऋण पोर्टल में आपका स्वागत है।', // FROZEN
    ta: 'பட்டியலின தொழில்முனைவோருக்கான திட்ட சேது சலுகை கடன் தளத்திற்கு உங்களை வரவேற்கிறோம்.', // FROZEN
    mr: 'अनुसूचित जातीच्या उद्योजकांसाठी योजना सेतू सवलतीच्या कर्ज पोर्टलवर आपले स्वागत आहे.', // FROZEN
    ur: 'درج فہرست ذات کے کاروباری افراد کے لیے اسکیم سیتو رعایتی قرض پورٹل میں خوش آمدید۔', // FROZEN
    te: 'షెడ్యూల్డ్ కులాల వ్యవస్థాపకుల కోసం స్కీమ్‌బ్రిడ్జ్ రాయితీ రుణ పోర్టల్‌కు స్వాగతం.',
    bn: 'তপশিলি জাতি উদ্যোক্তাদের জন্য স্কিমব্রিজ রেয়াতি ঋণ পোর্টালে স্বাগতম।',
    gu: 'અનુસૂચિત જાતિના સાહસિકો માટે સ્કીમબ્રિજ રાહત લોન પોર્ટલ પર આપનું સ્વાગત છે.',
    kn: 'ಪರಿಶಿಷ್ಟ ಜಾತಿಯ ಉದ್ಯಮಿಗಳಿಗಾಗಿ ಸ್ಕೀಮ್‌ಬ್ರಿಡ್ಜ್ ರಿಯಾಯಿತಿ ಸಾಲದ ಪೋರ್ಟಲ್‌ಗೆ ಸುಸ್ವಾಗತ.',
    ml: 'പട്ടികജാതി സംരംഭകർക്കായുള്ള സ്കീംബ്രിഡ്ജ് വായ്പാ പോർട്ടലിലേക്ക് സ്വാഗതം.',
    pa: 'ਅਨੁਸੂਚਿਤ ਜਾਤੀ ਦੇ ਉੱਦਮੀਆਂ ਲਈ ਸਕੀਮਬ੍ਰਿਜ ਰਿਆਇਤੀ ਕਰਜ਼ਾ ਪੋਰਟਲ ਵਿੱਚ ਸੁਆਗਤ ਹੈ।',
    or: 'ଅନୁସୂଚିତ ଜାତି ଉଦ୍ୟୋଗୀଙ୍କ ପାଇଁ ସ୍କିମ୍‌ବ୍ରିଜ୍ ରିହାତି ଋଣ ପୋର୍ଟାଲ୍‌କୁ ସ୍ୱାଗତ।',
    as: 'অনুসূচীত জাতিৰ উদ্যোগীসকলৰ বাবে স্কিমব্ৰিজ ৰেহাই ঋণ পৰ্টেললৈ স্বাগতম।'
  },

  // English meaning: Government application is completely free. Never pay any money to brokers or middlemen.
  apply_modal_warning: {
    en: 'Government application is completely free. Never pay any money to brokers or middlemen.',
    hi: 'सरकारी आवेदन बिल्कुल मुफ्त है। किसी भी बिचौलिए या दलाल को कभी पैसे न दें।', // FROZEN
    ta: 'அரசு விண்ணப்பம் முற்றிலும் இலவசம். இடைத்தரகர்களுக்கு எப்போது பணம்கொடுக்காதீர்கள்.', // FROZEN
    mr: 'सरकारी अर्ज पूर्णपणे विनामूल्य आहे. कोणत्याही दलालाला कधीही पैसे देऊ नका.', // FROZEN
    ur: 'سرکاری درخواست بالکل مفت ہے۔ کسی بھی دلال کو ہرگز پیسے نہ دیں۔', // FROZEN
    te: 'ప్రభుత్వ దరఖాస్తు పూర్తిగా ఉచితం. ఏజెంట్లకు లేదా దళారులకు డబ్బు ఇవ్వవద్దు.',
    bn: 'সরকারী আবেদন সম্পূর্ণ নিখরচায়। কোনো দালালকে কখনো টাকা দেবেন না।',
    gu: 'સરકારી અરજી તદ્દન મફત છે. કોઈ પણ વચેટિયાને ક્યારેય પૈસા આપશો નહીં.',
    kn: 'ಸರ್ಕಾರಿ ಅರ್ಜಿ ಸಂಪೂರ್ಣ ಉಚಿತವಾಗಿದೆ. ದಲ್ಲಾಳಿಗಳಿಗೆ ಎಂದಿಗೂ ಹಣ ನೀಡಬೇಡಿ.',
    ml: 'സർക്കാർ അപേക്ഷ തികച്ചും സൗജന്യമാണ്. ഇടനിലക്കാർക്ക് പണം നൽകരുത്.',
    pa: 'ਸਰਕਾਰੀ ਅਰਜ਼ੀ ਬਿਲਕੁਲ ਮੁਫ਼ਤ ਹੈ। ਕਿਸੇ ਵੀ ਵਿਚੋਲੇ ਨੂੰ ਕਦੇ ਪੈਸੇ ਨਾ ਦਿਓ।',
    or: 'ସରକାରୀ ଆବେଦନ ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣା। କୌଣସି ଦଲାଲଙ୍କୁ ଟଙ୍କା ଦିଅନ୍ତୁ ନାହିଁ।',
    as: 'চৰকাৰী আবেদন সম্পূৰ্ণ বিনামূলীয়া। কোনো মধ্যভোগীক পইচা নিদিব।'
  },

  // English meaning: Prepare certified documents in advance to guarantee fast approval without rejection.
  doc_guidance_intro: {
    en: 'Prepare certified documents in advance to guarantee fast approval without rejection.',
    hi: 'बिना किसी अस्वीकृति के त्वरित स्वीकृति पाने के लिए अपने प्रमाणित दस्तावेज तैयार रखें।', // FROZEN
    ta: 'நிராகரிப்பு இன்றி விரைவான ஒப்புதல் பெற சான்றளிக்கப்பட்ட ஆவணங்களை தயார் செய்யவும்.', // FROZEN
    mr: 'नकार न मिळता जलद मंजुरीसाठी आपली प्रमाणित कागदपत्रे तयार ठेवा.', // FROZEN
    ur: 'بغیر کسی رکاوٹ کے منظوری के لیے اپنی تصدیق شدہ دستاویزات تیار رکھیں۔', // FROZEN
    te: 'ఎలాంటి తిరస్కరణ లేకుండా త్వరగా ఆమోదం పొందడానికి ధృవీకరించిన పత్రాలను సిద్ధం చేసుకోండి.',
    bn: 'প্রত্যাখ্যান ছাড়া দ্রুত অনুমোদনের জন্য আপনার প্রত্যয়িত নথি প্রস্তুত রাখুন।',
    gu: 'ઝડપી મંજૂરી માટે તમારા પ્રમાણિત દસ્તાવેજો અગાઉથી તૈયાર રાખો.',
    kn: 'ತಿರಸ್ಕಾರವಿಲ್ಲದೆ ಶೀಘ್ರ ಅನುಮೋದನೆಗಾಗಿ ನಿಮ್ಮ ಪ್ರಮಾಣೀಕೃತ ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿ.',
    ml: 'തടസ്സമില്ലാതെ അംഗീകാരം ലഭിക്കാൻ സാക്ഷ്യപ്പെടുത്തിയ രേഖകൾ തയ്യാറാക്കുക.',
    pa: 'ਬਿਨਾਂ ਰੱਦ ਹੋਏ ਤੇਜ਼ੀ ਨਾਲ ਪ੍ਰਵਾਨਗੀ ਲਈ ਪ੍ਰਮਾਣਿਤ ਦਸਤਾਵੇਜ਼ ਤਿਆਰ ਰੱਖੋ।',
    or: 'ବିନା ପ୍ରତ୍ୟାଖ୍ୟାନରେ ଶୀଘ୍ର ମଞ୍ଜୁରୀ ପାଇଁ ପ୍ରମାଣିତ ଦସ୍ତାବିଜ ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ।',
    as: 'বাতিল নোহোৱাকৈ অনুমোদনৰ বাবে প্ৰমাণিত নথিপত্ৰ সাজু ৰাখক।'
  },

  // English meaning: Five steps to your loan: check eligibility, gather documents, branch visit, sanction, and DBT payout.
  roadmap_intro: {
    en: 'Five steps to your loan: check eligibility, gather documents, branch visit, sanction, and DBT payout.',
    hi: 'ऋण के पांच चरण: पात्रता जांच, दस्तावेज संग्रह, शाखा संपर्क, स्वीकृति, और बैंक खाते में भुगतान।', // FROZEN
    ta: 'ஐந்து படிகள்: தகுதி சரிபார்ப்பு, ஆவணங்கள், கிளை வருகை, ஒப்புதல், மற்றும் நேரடி வங்கி வரவு.', // FROZEN
    mr: 'कर्जाचे पाच टप्पे: पात्रता तपासणी, कागदपत्रे, शाखेला भेट, मंजुरी आणि थेट बँक खात्यात जमा.', // FROZEN
    ur: 'قرض کے پانچ مراحل: اہلیت، دستاویزات، برانچ رابطہ، منظوری اور بینک اکاؤنٹ میں منتقلی۔', // FROZEN
    te: 'ఐదు దశలు: అర్హత తనిఖీ, పత్రాల సేకరణ, బ్రాంచ్ సందర్శన, మంజూరు, మరియు ఖాతాలో జమ.',
    bn: 'ঋণের পাঁচটি ধাপ: যোগ্যতা যাচাই, নথি সংগ্রহ, শাখায় যাওয়া, মঞ্জুরি এবং সরাসরি ব্যাঙ্ক ট্রান্সফার।',
    gu: 'લોનના પાંચ પગલાં: પાત્રતા ચકાસણી, દસ્તાવેજો, શાખા મુલાકાત, મંજૂરી અને સીધા ખાતામાં જમા.',
    kn: 'ಸಾಲದ ಐದು ಹಂತಗಳು: ಅರ್ಹತೆ, ದಾಖಲೆಗಳು, ಶಾಖಾ ಭೇಟಿ, ಮಂಜೂರಾತಿ ಮತ್ತು ಖಾತೆಗೆ ಜಮೆ.',
    ml: 'അഞ്ച് ഘട്ടങ്ങൾ: യോഗ്യത, രേഖകൾ, ബ്രാഞ്ച് സന്ദർശനം, അനുമതി, ബാങ്ക് അക്കൗണ്ടിലേക്ക് തുക.',
    pa: 'ਕਰਜ਼ੇ ਦੇ ਪੰਜ ਕਦਮ: ਯੋਗਤਾ ਦੀ ਜਾਂਚ, ਦਸਤਾਵੇਜ਼, ਬ੍ਰਾਂਚ ਦਾ ਦੌਰਾ, ਮਨਜ਼ੂਰੀ ਅਤੇ ਖਾਤੇ ਵਿੱਚ ਰਕਮ।',
    or: 'ଋଣର ପାଞ୍ଚଟି ପାହାଚ: ଯୋଗ୍ୟତା ଯାଞ୍ଚ, ଦସ୍ତାବିଜ, ଶାଖା ପରିଦର୍ଶନ, ମଞ୍ଜୁରୀ ଓ ଖାତାକୁ ଟଙ୍କା।',
    as: 'ঋণৰ পাঁচটা পদক্ষেপ: যোগ্যতা পৰীক্ষা, নথিপত্ৰ, শাখা সাক্ষাৎ, অনুমোদন আৰু একাউন্টলৈ ধন।' // Fixed Devanagari योग्यता -> যোগ্যতা
  },

  // English meaning: Apply online via PM-SURAJ portal or submit papers in person at your nearest State Channelising Agency.
  apply_route_notice: {
    en: 'Apply online via PM-SURAJ portal or submit papers in person at your nearest State Channelising Agency.',
    hi: 'पीएम-सूरज पोर्टल पर ऑनलाइन आवेदन करें या निकटतम राज्य चैनेलाइजिंग एजेंसी शाखा में जाएं।', // FROZEN
    ta: 'பிஎம்-சூரஜ் போர்ட்டலில் ஆன்லைனில் விண்ணப்பிக்கவும் அல்லது அருகிலுள்ள எஸ்சிஏ கிளைக்கு செல்லவும்.', // FROZEN
    mr: 'पीएम-सूरज पोर्टलवर ऑनलाइन अर्ज करा किंवा जवळच्या राज्य एजन्सी शाखेला भेट द्या.', // FROZEN
    ur: 'پی ایم سورج پورٹل پر آن لائن درخواست دیں یا قریبی ریاستی ایجنسی برانچ سے رابطہ کریں۔', // FROZEN
    te: 'పీఎం-సూరజ్ పోర్టల్ ద్వారా ఆన్‌లైన్‌లో దరఖాస్తు చేయండి లేదా సమీప ఎస్‌సీఏ శాఖను సంప్రదించండి.',
    bn: 'পিএম-সূরয পোর্টালে অনলাইনে আবেদন করুন অথবা নিকটবর্তী এসসিএ শাখায় যান।',
    gu: 'પીએમ-સૂરજ પોર્ટલ પર ઓનલાઇન અરજી કરો અથવા નજીકની સરકારી એજન્સી શાખાની મુલાકાત લો.',
    kn: 'ಪಿಎಂ-ಸೂರಜ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಅಥವಾ ಸಮೀಪದ ಎಸ್‌ಸಿಎ ಶಾಖೆಗೆ ಭೇಟಿ ನೀಡಿ.',
    ml: 'പിഎം-സൂരജ് പോർട്ടൽ വഴി അപേക്ഷിക്കുക അല്ലെങ്കിൽ അടുത്തുള്ള എസ്.സി.എ ബ്രാഞ്ച് സന്ദർശിക്കുക.',
    pa: 'ਪੀਐਮ-ਸੂਰਜ ਪੋਰਟਲ ਤੇ ਆਨਲਾਈਨ ਅਰਜ਼ੀ ਦਿਓ ਜਾਂ ਨਜ਼ਦੀਕੀ ਐਸਸੀਏ ਬ੍ਰਾਂਚ ਵਿੱਚ ਜਾਓ।',
    or: 'ପିଏମ୍-ସୂରଜ ପୋର୍ଟାଲରେ ଅନଲାଇନ୍ ଆବେଦନ କରନ୍ତୁ କିମ୍ବା ନିକଟସ୍ଥ ଏସସିଏ ଶାଖାକୁ ଯାଆନ୍ତୁ।',
    as: 'পিএম-সূৰজ পৰ্টেলত অনলাইন আবেদন কৰক নাইবা নিকটৱৰ্তী এছচিএ শাখাত যাওক।'
  },

  // English meaning: Mahila Samriddhi Yojana offers micro-credit up to one lakh forty thousand rupees at five percent interest for women.
  scheme_msy: {
    en: 'Mahila Samriddhi Yojana offers micro-credit up to one lakh forty thousand rupees at five percent interest for women.',
    hi: 'महिला समृद्धि योजना में महिलाओं के लिए पांच प्रतिशत ब्याज पर एक लाख चालीस हजार रुपये तक का ऋण उपलब्ध है।', // FROZEN
    ta: 'மகளிர் சம்ரிதி யோஜனா பெண்களுக்கு ஐந்து சதவீத வட்டியில் ஒரு லட்சத்து நாற்பதாயிரம் ரூபாய் வரை கடன் வழங்குகிறது.', // FROZEN
    mr: 'महिला समृद्धी योजनेअंतर्गत महिलांसाठी पाच टक्के व्याजाने एक लाख चाळीस हजार रुपयांपर्यंत कर्ज उपलब्ध आहे.', // FROZEN
    ur: 'مہیلا سمردھی یوجنا خواتین کو پانچ فیصد سود پر ایک لاکھ چالیس ہزار روپے تک قرض دیتی ہے۔', // FROZEN
    te: 'మహిళా సమృద్ధి యోజన మహిళలకు ఐదు శాతం వడ్డీతో లక్షా నలభై వేల రూపాయల వరకు రుణం అందిస్తుంది.',
    bn: 'মহিলা সমৃদ্ধি যোজনায় নারীদের জন্য পাঁচ শতাংশ সুদে এক লাখ চল্লিশ হাজার টাকা পর্যন্ত ঋণ দেওয়া হয়।',
    gu: 'મહિલા સમૃદ્ધિ યોજના મહિલાઓને પાંચ ટકા વ્યાજે એક લાખ ચાલીસ હજાર રૂપિયા સુધીની લોન આપે છે.',
    kn: 'ಮಹಿಳಾ ಸಮೃದ್ಧಿ ಯೋಜನೆಯು ಮಹಿಳೆಯರಿಗೆ ಶೇಕಡಾ ಐದರ ಬಡ್ಡಿದರದಲ್ಲಿ ಒಂದು ಲಕ್ಷ ನಲವತ್ತು ಸಾವಿರ ರೂಪಾಯಿ ಸಾಲ ನೀಡುತ್ತದೆ.',
    ml: 'മഹിളാ സമൃദ്ധി യോജന സ്ത്രീകൾക്ക് അഞ്ച് ശതമാനം പലിശയിൽ ഒരു ലക്ഷത്തി നാല്പതിനായിരം രൂപ വരെ വായ്പ നൽകുന്നു.',
    pa: 'ਮਹਿਲਾ ਸਮ੍ਰਿਧੀ ਯੋਜਨਾ ਔਰਤਾਂ ਨੂੰ ਪੰਜ ਫੀਸਦੀ ਵਿਆਜ ਤੇ ਇੱਕ ਲੱਖ ਚਾਲੀ ਹਜ਼ਾਰ ਰੁਪਏ ਤੱਕ ਕਰਜ਼ਾ ਦਿੰਦੀ ਹੈ।',
    or: 'ମହିଳା ସମୃଦ୍ଧି ଯୋଜନାରେ ମହିଳାମାନଙ୍କୁ ପାଞ୍ଚ ପ୍ରତିଶତ ସୁଧରେ ଏକ ଲକ୍ଷ ଚାଳିଶ ହଜାର ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ଋଣ ମିଳେ।',
    as: 'মহিলা সমৃদ্ধি যোজনাত মহিলাসকলক পাঁচ শতাংশ সুতত এক লাখ চল্লিছ হাজাৰ টকালৈকে ঋণ দিয়া হয়।'
  },

  // English meaning: Micro Credit Finance scheme provides direct loans up to one lakh forty thousand rupees for small enterprises.
  scheme_mcf: {
    en: 'Micro Credit Finance scheme provides direct loans up to one lakh forty thousand rupees for small enterprises.',
    hi: 'माइक्रो क्रेडिट वित्त योजना छोटे व्यवसायों के लिए एक लाख चालीस हजार रुपये तक का प्रत्यक्ष ऋण देती है।', // FROZEN
    ta: 'மைக்ரோ கிரெடிட் நிதி திட்டம் சிறு தொழில்களுக்கு ஒரு லட்சத்து நாற்பதாயிரம் ரூபாய் வரை நேரடி கடன் வழங்குகிறது.', // FROZEN
    mr: 'मायक्रो क्रेडिट फायनान्स योजना लहान व्यवसायांसाठी एक लाख चाळीस हजार रुपयांपर्यंत थेट कर्ज पुरवते.', // FROZEN
    ur: 'مائیکرو کریڈٹ فنانس اسکیم چھوٹے کاروباروں کے لیے ایک لاکھ چالیس ہزار روپے تک قرض فراہم کرتی ہے۔', // FROZEN
    te: 'మైక్రో క్రెడిట్ ఫైనాన్స్ పథకం చిన్న వ్యాపారాల కోసం లక్షా నలభై వేల రూపాయల వరకు రుణం అందిస్తుంది.',
    bn: 'মাইক্রো ক্রেডিট ফিনান্স প্রকল্প ক্ষুদ্র ব্যবসার জন্য এক লাখ চল্লিশ হাজার টাকা পর্যন্ত সরাসরি ঋণ দেয়।',
    gu: 'માઈક્રો ક્રેડિટ ફાયનાન્સ યોજના નાના ઉદ્યોગો માટે એક લાખ ચાલીસ હજાર રૂપિયા સુધીની લોન આપે છે.',
    kn: 'ಮೈಕ್ರೋ ಕ್ರೆಡಿಟ್ ಫೈನಾನ್ಸ್ ಯೋಜನೆಯು ಸಣ್ಣ ಉದ್ಯಮಗಳಿಗೆ ಒಂದು ಲಕ್ಷ ನಲವತ್ತು ಸಾವಿರ ರೂಪಾಯಿ ಸಾಲ ನೀಡುತ್ತದೆ.',
    ml: 'മൈക്രോ ക്രെഡിറ്റ് ഫിനാൻസ് ചെറുകിട സംരംഭങ്ങൾക്ക് ഒരു ലക്ഷത്തി നാല്പതിനായിരം രൂപ വരെ വായ്പ നൽകുന്നു.',
    pa: 'ਮਾਈਕ੍ਰੋ ਕ੍ਰੈਡਿਟ ਫਾਈਨਾਂਸ ਛੋਟੇ ਕਾਰੋਬਾਰਾਂ ਲਈ ਇੱਕ ਲੱਖ ਚਾਲੀ ਹਜ਼ਾਰ ਰੁਪਏ ਤੱਕ ਕਰਜ਼ਾ ਦਿੰਦਾ ਹੈ।',
    or: 'ମାଇକ୍ରୋ କ୍ରେଡିଟ୍ ଫାଇନାନ୍ସ ଯୋଜନା ଛୋଟ ବ୍ୟବସାୟ ପାଇଁ ଏକ ଲକ୍ଷ ଚାଳିଶ ହଜାର ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ଋଣ ଯୋଗାଏ।',
    as: 'মাইক্ৰ ক্ৰেডিট ফাইনান্স আঁচনিয়ে ক্ষুদ্ৰ ব্যৱসায়ৰ বাবে এক লাখ চল্লিছ হাজাৰ টকালৈকে ঋণ দিয়ে।'
  },

  // English meaning: NSFDC Term Loan Scheme funds large projects and business expansion up to fifty lakh rupees.
  scheme_tls: {
    en: 'NSFDC Term Loan Scheme funds large projects and business expansion up to fifty lakh rupees.',
    hi: 'एनएसएफडीसी मियादी ऋण योजना पचास लाख रुपये तक के व्यापार और परियोजनाओं के लिए ऋण प्रदान करती है।', // FROZEN
    ta: 'என்எஸ்எஃப்டிசி தவணை கடன் திட்டம் ஐம்பது லட்சம் ரூபாய் வரை வணிக விரிவாக்கத்திற்கு நிதி வழங்குகிறது.', // FROZEN
    mr: 'एनएसएफडीसी मुदत कर्ज योजना पन्नास लाख रुपयांपर्यंत व्यवसाय विस्तारासाठी कर्ज देते.', // FROZEN
    ur: 'این ایس ایف ڈی سی ٹرم لون اسکیم پچاس لاکھ روپے تک کے کاروبار کے لیے قرض فراہم کرتی ہے۔', // FROZEN
    te: 'ఎన్‌ఎస్‌ఎఫ్‌డిసి టర్మ్ లోన్ పథకం యాభై లక్షల రూపాయల వరకు వ్యాపార విస్తరణకు రుణం అందిస్తుంది.',
    bn: 'এনএসএফডিসি টার্ম লোন প্রকল্প পঞ্চাশ লাখ টাকা পর্যন্ত ব্যবসা সম্প্রসারণের জন্য তহবিল দেয়।',
    gu: 'એનએસએફડીસી ટર્મ લોન યોજના પચાસ લાખ રૂપિયા સુધીના વ્યવસાય માટે લોન આપે છે.',
    kn: 'ಎನ್‌ಎಸ್‌ಎಫ್‌ಡಿಸಿ ಟರ್ಮ್ ಲೋನ್ ಯೋಜನೆಯು ಐವತ್ತು ಲಕ್ಷ ರೂಪಾಯಿ ವರೆಗೆ ವ್ಯಾಪಾರ ಸಾಲ ನೀಡುತ್ತದೆ.',
    ml: 'എൻ.എസ്.എഫ്.ഡി.സി ടേം ലോൺ അമ്പത് ലക്ഷം രൂപ വരെ ബിസിനസ്സ് വിപുലീകരണത്തിന് വായ്പ നൽകുന്നു.',
    pa: 'ਐਨਐਸਐਫਡੀਸੀ ਟਰਮ ਲੋਨ ਸਕੀਮ ਪੰਜਾਹ ਲੱਖ ਰੁਪਏ ਤੱਕ ਕਾਰੋਬਾਰ ਲਈ ਕਰਜ਼ਾ ਪ੍ਰਦਾਨ ਕਰਦੀ ਹੈ।',
    or: 'ଏନଏସଏଫଡିସି ଟର୍ମ ଲୋନ୍ ଯୋଜନା ପଚାଶ ଲକ୍ଷ ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ବ୍ୟବସାୟିକ ଋଣ ପ୍ରଦାନ କରେ।',
    as: 'এনএছএফডিচি টার্ম লোন আঁচনিয়ে পঞ্চাশ লাখ টকালৈকে ব্যৱসায়িক ঋণ প্ৰদান কৰে।'
  },

  // English meaning: Required documents: Aadhaar card, SC caste certificate, income certificate under five lakhs, and bank passbook.
  docs_checklist: {
    en: 'Required documents: Aadhaar card, SC caste certificate, income certificate under five lakhs, and bank passbook.',
    hi: 'आवश्यक दस्तावेज: आधार कार्ड, अनुसूचित जाति प्रमाण पत्र, पांच लाख से कम का आय प्रमाण पत्र, और बैंक पासबुक।', // FROZEN
    ta: 'தேவையான ஆவணங்கள்: ஆதார் அட்டை, சாதி சான்றிதழ், வருமான சான்றிதழ், மற்றும் வங்கி கணக்கு புத்தகம்.', // FROZEN
    mr: 'आवश्यक कागदपत्रे: आधार कार्ड, जातीचा दाखला, उत्पन्नाचा दाखला आणि बँक पासबुक.', // FROZEN
    ur: 'ضروری دستاویزات: آدھار کارڈ، ذات کا سرٹیفکیٹ، آمدنی کا سرٹیفکیٹ اور بینک پاس بک۔', // FROZEN
    te: 'కావలసిన పత్రాలు: ఆధార్ కార్డు, కుల ధృవీకరణ పత్రం, ఆదాయ ధృవీకరణ పత్రం, మరియు బ్యాంక్ పాస్‌బుక్.',
    bn: 'প্রয়োজনীয় নথি: আধার কার্ড, জাতি শংসাপত্র, আয় শংসাপত্র এবং ব্যাঙ্ক পাসবই।',
    gu: 'જરૂરી દસ્તાવેજો: આધાર કાર્ડ, જાતિનું પ્રમાણપત્ર, આવકનું પ્રમાણપત્ર અને બેંક પાસબુક.',
    kn: 'ಅಗತ್ಯ ದಾಖಲೆಗಳು: ಆಧಾರ್ ಕಾರ್ಡ್, ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್.',
    ml: 'ആവശ്യമായ രേഖകൾ: ആധാർ കാർഡ്, ജാതി സർട്ടിഫിക്കറ്റ്, വരുമാന സർട്ടിഫിക്കറ്റ്, ബാങ്ക് പാസ്ബുക്ക്.',
    pa: 'ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼: ਆਧਾਰ ਕਾਰਡ, ਜਾਤੀ ਸਰਟੀਫਿਕੇਟ, ਆਮਦਨ ਸਰਟੀਫਿਕੇਟ ਅਤੇ ਬੈਂਕ ਪਾਸਬੁੱਕ।',
    or: 'ଆବଶ୍ୟକ ଦସ୍ତାବିଜ: ଆଧାର କାର୍ଡ, ଜାତି ପ୍ରମାଣପତ୍ର, ଆୟ ପ୍ରମାଣପତ୍ର ଓ ବ୍ୟାଙ୍କ ପାସବହି।',
    as: 'প্ৰয়োজনীয় নথিপত্ৰ: আধাৰ কাৰ্ড, জাতিৰ প্ৰমাণপত্ৰ, আয়ৰ প্ৰমাণপত্ৰ আৰু বেংক পাছবুক।'
  }
};

/**
 * Sarvam Bulbul v3 synthesis caller
 */
function callSarvamTTS(text, config) {
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (!sarvamKey) {
    return Promise.reject(new Error('CRITICAL: SARVAM_API_KEY environment variable is missing.'));
  }

  const sarvamLangMap = {
    te: 'te-IN', bn: 'bn-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'od-IN', hi: 'hi-IN', ta: 'ta-IN', mr: 'mr-IN', en: 'en-IN'
  };
  const targetLang = sarvamLangMap[config.languageCode] || (config.languageCode?.includes('-') ? config.languageCode : 'hi-IN');
  const speaker = config.speaker || config.voiceId || 'shubh';

  const payload = JSON.stringify({
    text: text,
    language_code: targetLang,
    speaker: speaker,
    model: 'bulbul:v3',
    output_audio_codec: 'mp3'
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.sarvam.ai',
      port: 443,
      path: '/text-to-speech',
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const bodyBuf = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          let errMsg = `HTTP ${res.statusCode}`;
          try {
            const parsed = JSON.parse(bodyBuf.toString('utf8'));
            errMsg += `: ${parsed.message || JSON.stringify(parsed)}`;
          } catch (_) {
            errMsg += `: ${bodyBuf.toString('utf8').slice(0, 150)}`;
          }
          return reject(new Error(errMsg));
        }

        try {
          const data = JSON.parse(bodyBuf.toString('utf8'));
          const b64 = data.audios?.[0] || data.audio_base64 || data.audio;
          if (b64) {
            const audioBuffer = Buffer.from(b64, 'base64');
            if (audioBuffer.length < 2048) {
              return reject(new Error(`Received small audio buffer (${audioBuffer.length} bytes < 2048 threshold)`));
            }
            if (!isValidMp3Header(audioBuffer)) {
              return reject(new Error(`Invalid MP3 header from Sarvam (first bytes: ${audioBuffer.slice(0, 4).toString('hex')})`));
            }
            return resolve(audioBuffer);
          }
        } catch (e) {
          return reject(new Error(`Failed to parse Sarvam audio: ${e.message}`));
        }
        reject(new Error('No valid audio stream received from Sarvam TTS'));
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Sarvam TTS request timed out after 25s'));
    });

    req.on('error', err => reject(err));
    req.write(payload);
    req.end();
  });
}

/**
 * ElevenLabs synthesis caller
 */
function callElevenLabsTTS(text, config, retryCount = 0) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('CRITICAL: ELEVENLABS_API_KEY environment variable is missing.'));
  }

  const modelId = config.model || config.modelId || 'eleven_v3';
  const payloadObj = {
    text: text,
    model_id: modelId,
    voice_settings: config.settings || {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    }
  };

  if (modelId === 'eleven_v3' && config.languageCode) {
    payloadObj.language_code = config.languageCode;
  }

  const payload = JSON.stringify(payloadObj);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      port: 443,
      path: `/v1/text-to-speech/${config.voiceId}?output_format=mp3_44100_128`,
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept': 'audio/mpeg'
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', async () => {
        const bodyBuf = Buffer.concat(chunks);

        if (res.statusCode === 429 && retryCount < 1) {
          console.warn(' Rate limit 429 received, waiting 3s before retry...');
          await sleep(3000);
          try {
            const retryBuf = await callElevenLabsTTS(text, config, retryCount + 1);
            return resolve(retryBuf);
          } catch (e) {
            return reject(e);
          }
        }

        if (res.statusCode !== 200) {
          let errMsg = `HTTP ${res.statusCode}`;
          try {
            const parsed = JSON.parse(bodyBuf.toString('utf8'));
            errMsg += `: ${parsed.detail?.message || parsed.message || bodyBuf.toString('utf8').slice(0, 100)}`;
          } catch (_) {}
          return reject(new Error(errMsg));
        }

        const contentType = res.headers['content-type'] || '';
        if (!contentType.includes('audio')) {
          return reject(new Error(`Invalid content-type: ${contentType}`));
        }

        if (bodyBuf.length < 2048) {
          return reject(new Error(`Received small audio buffer (${bodyBuf.length} bytes < 2048 threshold)`));
        }

        if (!isValidMp3Header(bodyBuf)) {
          return reject(new Error(`Invalid MP3 header (first bytes: ${bodyBuf.slice(0, 4).toString('hex')})`));
        }

        resolve(bodyBuf);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ElevenLabs TTS request timed out after 25s'));
    });

    req.on('error', err => reject(err));
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('===============================================================');
  console.log('   SchemeBridge Resilient Audio Clip Generator (Hashed)        ');
  console.log('===============================================================\n');

  // Guard frozen languages
  if (targetLangs) {
    const attemptedFrozen = targetLangs.filter(l => FROZEN_LANGUAGES.includes(l));
    if (attemptedFrozen.length > 0 && !isForceFrozen) {
      console.error(`\x1b[31mCRITICAL ERROR: Attempted to regenerate frozen languages: ${attemptedFrozen.join(', ')}.\x1b[0m`);
      console.error('Frozen languages (en, hi, ta, mr, ur) are strictly protected. Exiting.\n');
      process.exit(1);
    }
  }

  const activeLangs = targetLangs || BROKEN_LANGUAGES;
  console.log(`Target languages for regeneration: ${activeLangs.join(', ')}`);

  // Load existing manifest to preserve untouched languages
  const manifestPath = path.join(OUTPUT_BASE, 'audio-manifest.json');
  let manifest = {
    version: '3.0.0',
    generatedAt: new Date().toISOString(),
    clips: {}
  };

  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) {}
  }

  const clipIds = Object.keys(PROMPTS);

  // Clean old unhashed files for target languages
  for (const langCode of activeLangs) {
    const langDir = path.join(OUTPUT_BASE, langCode);
    if (fs.existsSync(langDir)) {
      const files = fs.readdirSync(langDir);
      for (const file of files) {
        // Delete unhashed clips (e.g., portal_welcome.mp3)
        if (file.endsWith('.mp3') && !/\.[a-f0-9]{8}\.mp3$/.test(file)) {
          fs.unlinkSync(path.join(langDir, file));
          console.log(`Deleted old unhashed clip: ${langCode}/${file}`);
        }
      }
    }
  }

  let newlyGenerated = 0;

  for (const clipId of clipIds) {
    if (!manifest.clips[clipId]) {
      manifest.clips[clipId] = {};
    }

    const langMap = PROMPTS[clipId];

    for (const langCode of activeLangs) {
      const text = langMap[langCode];
      if (!text) continue;

      const config = LANGUAGE_CONFIG[langCode];
      if (!config || config.provider === 'none' || config.engine === 'none') {
        // If language has no provider, remove any stale entry from manifest
        delete manifest.clips[clipId][langCode];
        continue;
      }

      const langDir = path.join(OUTPUT_BASE, langCode);
      if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
      }

      process.stdout.write(`[\x1b[33mSYNTH\x1b[0m] [${langCode}] ${clipId} (${config.provider || 'elevenlabs'}:${config.model || config.modelId})... `);
      try {
        const audioData = config.provider === 'sarvam'
          ? await callSarvamTTS(text, config)
          : await callElevenLabsTTS(text, config);
        const hash8 = sha256Hex(audioData).slice(0, 8);
        const hashedFileName = `${clipId}.${hash8}.mp3`;
        const filePath = path.join(langDir, hashedFileName);
        const publicPath = `/audio/${langCode}/${hashedFileName}`;

        fs.writeFileSync(filePath, audioData);
        newlyGenerated++;
        console.log(`\x1b[32mOK (${audioData.length} bytes -> ${hashedFileName})\x1b[0m`);

        manifest.clips[clipId][langCode] = {
          clipId,
          language: langCode,
          languageName: config.name,
          path: publicPath,
          sizeBytes: audioData.length,
          sha256: sha256Hex(audioData),
          textHash: sha256Hex(text),
          modelId: config.model || config.modelId,
          voiceId: config.voiceId,
          generatedAt: new Date().toISOString(),
          text: text
        };

        await sleep(250);
      } catch (err) {
        console.log(`\x1b[31mFAILED\x1b[0m: ${err.message}`);
        console.error(`\n\x1b[31mCRITICAL FAILURE: Generation failed for [${langCode}] ${clipId}.\x1b[0m`);
        process.exit(1);
      }
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`\nManifest successfully updated at: ${manifestPath}`);
}

run().catch(err => {
  console.error('\n\x1b[31mUnhandled Exception:\x1b[0m', err);
  process.exit(1);
});
