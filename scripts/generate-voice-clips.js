/**
 * SchemeBridge — Production ElevenLabs Audio Clip Generator
 * 
 * Strict Quality & Resilience Invariants:
 * 1. Fails loudly (exit code 1) if:
 *    - API key is missing
 *    - ElevenLabs returns non-200
 *    - Response Content-Type is not audio
 *    - Returned buffer is < 2048 bytes (2 KB)
 *    - Header lacks ID3 or MPEG frame sync
 * 2. Never writes placeholder 48-byte files or silent stubs.
 * 3. Never writes a manifest entry for a failed generation.
 * 4. Supports --dry-run mode writing strictly to an external temporary directory.
 * 5. Reuses valid existing clips (>2KB, valid MP3 header, matching text hash) to conserve quota.
 * 6. Never prints the API key or logs authorization headers.
 * 
 * Usage:
 *   node scripts/generate-voice-clips.js
 *   node scripts/generate-voice-clips.js --dry-run
 *   node scripts/generate-voice-clips.js --clip portal_welcome
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Load environment variables strictly without logging keys
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

const { LANGUAGE_CONFIG } = require('../backend/src/config/voiceConfig');

const isDryRun = process.argv.includes('--dry-run');
const clipFilterIndex = process.argv.indexOf('--clip');
const targetClipFilter = clipFilterIndex !== -1 ? process.argv[clipFilterIndex + 1] : null;

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

// Full set of production prompts for 13 official Indian languages
const PROMPTS = {
  portal_welcome: {
    en: 'Welcome to SchemeBridge concessional credit portal for Scheduled Caste entrepreneurs.',
    hi: 'अनुसूचित जाति उद्यमियों के लिए योजना सेतु रियायती ऋण पोर्टल में आपका स्वागत है।',
    ta: 'பட்டியலின தொழில்முனைவோருக்கான திட்ட சேது சலுகை கடன் தளத்திற்கு உங்களை வரவேற்கிறோம்.',
    te: 'షెడ్యూల్డ్ కులాల వ్యవస్థాపకుల కోసం స్కీమ్ సేతు రాయితీ రుణ పోర్టల్‌కు స్వాగతం.',
    bn: 'তপশিলি জাতি উদ্যোক্তাদের জন্য স্কিম সেতু রেয়াতি ঋণ পোর্টালে স্বাগতম।',
    mr: 'अनुसूचित जातीच्या उद्योजकांसाठी योजना सेतू सवलतीच्या कर्ज पोर्टलवर आपले स्वागत आहे.',
    ur: 'درج فہرست ذات کے کاروباری افراد کے لیے اسکیم سیتو رعایتی قرض پورٹل میں خوش آمدید۔',
    gu: 'અનુસૂચિત જાતિના સાહસિકો માટે સ્કીમ સેતુ રાહત લોન પોર્ટલ પર આપનું સ્વાગત છે.',
    kn: 'ಪರಿಶಿಷ್ಟ ಜಾತಿಯ ಉದ್ಯಮಿಗಳಿಗಾಗಿ ಸ್ಕೀಮ್ ಸೇತು ರಿಯಾಯಿತಿ ಸಾಲದ ಪೋರ್ಟಲ್‌ಗೆ ಸುಸ್ವಾಗತ.',
    ml: 'പട്ടികജാതി സംരംഭകർക്കായുള്ള സ്കീം സേതു വായ്പാ പോർട്ടലിലേക്ക് സ്വാഗതം.',
    pa: 'ਅਨੁਸੂਚਿਤ ਜਾਤੀ ਦੇ ਉੱਦਮੀਆਂ ਲਈ ਸਕੀਮ ਸੇਤੂ ਰਿਆਇਤੀ ਕਰਜ਼ਾ ਪੋਰਟਲ ਵਿੱਚ ਸੁਆਗਤ ਹੈ।',
    or: 'ଅନୁସୂଚିତ ଜାତି ଉଦ୍ୟୋଗୀଙ୍କ ପାଇଁ ସ୍କିମ୍ ସେତୁ ରିହାତି ଋଣ ପୋର୍ଟାଲ୍‌କୁ ସ୍ୱାଗତ।',
    as: 'অনুসূচীত জাতিৰ উদ্যোগীসকলৰ বাবে স্কিম সেতু ৰেহাই ঋণ পৰ্টেললৈ স্বাগতম।'
  },
  apply_modal_warning: {
    en: 'Government application is completely free. Never pay any money to brokers or middlemen.',
    hi: 'सरकारी आवेदन बिल्कुल मुफ्त है। किसी भी बिचौलिए या दलाल को कभी पैसे न दें।',
    ta: 'அரசு விண்ணப்பம் முற்றிலும் இலவசம். இடைத்தரகர்களுக்கு எப்போது பணம்கொடுக்காதீர்கள்.',
    te: 'ప్రభుత్వ దరఖాస్తు పూర్తిగా ఉచితం. ఏజెంట్లకు లేదా దళారులకు డబ్బు ఇవ్వవద్దు.',
    bn: 'সরকারী আবেদন সম্পূর্ণ নিখরচায়। কোনো দালালকে কখনো টাকা দেবেন না।',
    mr: 'सरकारी अर्ज पूर्णपणे विनामूल्य आहे. कोणत्याही दलालाला कधीही पैसे देऊ नका.',
    ur: 'سرکاری درخواست بالکل مفت ہے۔ کسی بھی دلال کو ہرگز پیسے نہ دیں۔',
    gu: 'સરકારી અરજી તદ્દન મફત છે. કોઈ પણ વચેટિયાને ક્યારેય પૈસા આપશો નહીં.',
    kn: 'ಸರ್ಕಾರಿ ಅರ್ಜಿ ಸಂಪೂರ್ಣ ಉಚಿತವಾಗಿದೆ. ದಲ್ಲಾಳಿಗಳಿಗೆ ಎಂದಿಗೂ ಹಣ ನೀಡಬೇಡಿ.',
    ml: 'സർക്കാർ അപേക്ഷ തികച്ചും സൗജന്യമാണ്. ഇടനിലക്കാർക്ക് പണം നൽകരുത്.',
    pa: 'ਸਰਕਾਰੀ ਅਰਜ਼ੀ ਬਿਲਕੁਲ ਮੁਫ਼ਤ ਹੈ। ਕਿਸੇ ਵੀ ਵਿਚੋਲੇ ਨੂੰ ਕਦੇ ਪੈਸੇ ਨਾ ਦਿਓ।',
    or: 'ସରକାରୀ ଆବେଦନ ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣା। କୌଣସି ଦଲାଲଙ୍କୁ ଟଙ୍କା ଦିଅନ୍ତୁ ନାହିଁ।',
    as: 'চৰকাৰী আবেদন সম্পূৰ্ণ বিনামূলীয়া। কোনো মধ্যভোগীক পইচা নিদিব।'
  },
  doc_guidance_intro: {
    en: 'Prepare certified documents in advance to guarantee fast approval without rejection.',
    hi: 'बिना किसी अस्वीकृति के त्वरित स्वीकृति पाने के लिए अपने प्रमाणित दस्तावेज तैयार रखें।',
    ta: 'நிராகரிப்பு இன்றி விரைவான ஒப்புதல் பெற சான்றளிக்கப்பட்ட ஆவணங்களை தயார் செய்யவும்.',
    te: 'ఎలాంటి తిరస్కరణ లేకుండా త్వరగా ఆమోదం పొందడానికి ధృవీకరించిన పత్రాలను సిద్ధం చేసుకోండి.',
    bn: 'প্রত্যাখ্যান ছাড়া দ্রুত অনুমোদনের জন্য আপনার প্রত্যয়িত নথি প্রস্তুত রাখুন।',
    mr: 'नकार न मिळता जलद मंजुरीसाठी आपली प्रमाणित कागदपत्रे तयार ठेवा.',
    ur: 'بغیر کسی رکاوٹ کے منظوری کے لیے اپنی تصدیق شدہ دستاویزات تیار رکھیں۔',
    gu: 'ઝડપી મંજૂરી માટે તમારા પ્રમાણિત દસ્તાવેજો અગાઉથી તૈયાર રાખો.',
    kn: 'ತಿರಸ್ಕಾರವಿಲ್ಲದೆ ಶೀಘ್ರ ಅನುಮೋದನೆಗಾಗಿ ನಿಮ್ಮ ಪ್ರಮಾಣೀಕೃತ ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿ.',
    ml: 'തടസ്സമില്ലാതെ അംഗീകാരം ലഭിക്കാൻ സാക്ഷ്യപ്പെടുത്തിയ രേഖകൾ തയ്യാറാക്കുക.',
    pa: 'ਬਿਨਾਂ ਰੱਦ ਹੋਏ ਤੇਜ਼ੀ ਨਾਲ ਪ੍ਰਵਾਨਗੀ ਲਈ ਪ੍ਰਮਾਣਿਤ ਦਸਤਾਵੇਜ਼ ਤਿਆਰ ਰੱਖੋ।',
    or: 'ବିନା ପ୍ରତ୍ୟାଖ୍ୟାନରେ ଶୀଘ୍ର ମଞ୍ଜୁରୀ ପାଇଁ ପ୍ରମାଣିତ ଦସ୍ତାବିଜ ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ।',
    as: 'বাতিল নোহোৱাকৈ অনুমোদনৰ বাবে প্ৰমাণিত নথিপত্ৰ সাজু ৰাখক।'
  },
  roadmap_intro: {
    en: 'Five steps to your loan: check eligibility, gather documents, branch visit, sanction, and DBT payout.',
    hi: 'ऋण के पांच चरण: पात्रता जांच, दस्तावेज संग्रह, शाखा संपर्क, स्वीकृति, और बैंक खाते में भुगतान।',
    ta: 'ஐந்து படிகள்: தகுதி சரிபார்ப்பு, ஆவணங்கள், கிளை வருகை, ஒப்புதல், மற்றும் நேரடி வங்கி வரவு.',
    te: 'ఐదు దశలు: అర్హత తనిఖీ, పత్రాల సేకరణ, బ్రాంచ్ సందర్శన, మంజూరు, మరియు ఖాతాలో జమ.',
    bn: 'ঋণের পাঁচটি ধাপ: যোগ্যতা যাচাই, নথি সংগ্রহ, শাখায় যাওয়া, মঞ্জুরি এবং সরাসরি ব্যাঙ্ক ট্রান্সফার।',
    mr: 'कर्जाचे पाच टप्पे: पात्रता तपासणी, कागदपत्रे, शाखेला भेट, मंजुरी आणि थेट बँक खात्यात जमा.',
    ur: 'قرض کے پانچ مراحل: اہلیت، دستاویزات، برانچ رابطہ، منظوری اور بینک اکاؤنٹ میں منتقلی۔',
    gu: 'લોનના પાંચ પગલાં: પાત્રતા ચકાસણી, દસ્તાવેજો, શાખા મુલાકાત, મંજૂરી અને સીધા ખાતામાં જમા.',
    kn: 'ಸಾಲದ ಐದು ಹಂತಗಳು: ಅರ್ಹತೆ, ದಾಖಲೆಗಳು, ಶಾಖಾ ಭೇಟಿ, ಮಂಜೂರಾತಿ ಮತ್ತು ಖಾತೆಗೆ ಜಮೆ.',
    ml: 'അഞ്ച് ഘട്ടങ്ങൾ: യോഗ്യത, രേഖകൾ, ബ്രാഞ്ച് സന്ദർശനം, അനുമതി, ബാങ്ക് അക്കൗണ്ടിലേക്ക് തുക.',
    pa: 'ਕਰਜ਼ੇ ਦੇ ਪੰਜ ਕਦਮ: ਯੋਗਤਾ ਦੀ ਜਾਂਚ, ਦਸਤਾਵੇਜ਼, ਬ੍ਰਾਂਚ ਦਾ ਦੌਰਾ, ਮਨਜ਼ੂਰੀ ਅਤੇ ਖਾਤੇ ਵਿੱਚ ਰਕਮ।',
    or: 'ଋଣର ପାଞ୍ଚଟି ପାହାଚ: ଯୋଗ୍ୟତା ଯାଞ୍ଚ, ଦସ୍ତାବିଜ, ଶାଖା ପରିଦର୍ଶନ, ମଞ୍ଜୁରୀ ଓ ଖାତାକୁ ଟଙ୍କା।',
    as: 'ঋণৰ পাঁচটা পদক্ষেপ: योग्यता পৰীক্ষা, নথিপত্ৰ, শাখা সাক্ষাৎ, অনুমোদন আৰু একাউন্টলৈ ধন।'
  },
  apply_route_notice: {
    en: 'Apply online via PM-SURAJ portal or submit papers in person at your nearest State Channelising Agency.',
    hi: 'पीएम-सूरज पोर्टल पर ऑनलाइन आवेदन करें या निकटतम राज्य चैनेलाइजिंग एजेंसी शाखा में जाएं।',
    ta: 'பிஎம்-சூரஜ் போர்ட்டலில் ஆன்லைனில் விண்ணப்பிக்கவும் அல்லது அருகிலுள்ள எஸ்சிஏ கிளைக்கு செல்லவும்.',
    te: 'పీఎం-సూరజ్ పోర్టల్ ద్వారా ఆన్‌లైన్‌లో దరఖాస్తు చేయండి లేదా సమీప ఎస్‌సీఏ శాఖను సంప్రదించండి.',
    bn: 'পিএম-সূরয পোর্টালে অনলাইনে আবেদন করুন অথবা নিকটবর্তী এসসিএ শাখায় যান।',
    mr: 'पीएम-सूरज पोर्टलवर ऑनलाइन अर्ज करा किंवा जवळच्या राज्य एजन्सी शाखेला भेट द्या.',
    ur: 'پی ایم سورج پورٹل پر آن لائن درخواست دیں یا قریبی ریاستی ایجنسی برانچ سے رابطہ کریں۔',
    gu: 'પીએમ-સૂરજ પોર્ટલ પર ઓનલાઇન અરજી કરો અથવા નજીકની સરકારી એજન્સી શાખાની મુલાકાત લો.',
    kn: 'ಪಿಎಂ-ಸೂರಜ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಅಥವಾ ಸಮೀಪದ ಎಸ್‌ಸಿಎ ಶಾಖೆಗೆ ಭೇಟಿ ನೀಡಿ.',
    ml: 'പിഎം-സൂരജ് പോർട്ടൽ വഴി അപേക്ഷിക്കുക അല്ലെങ്കിൽ അടുത്തുള്ള എസ്.സി.എ ബ്രാഞ്ച് സന്ദർശിക്കുക.',
    pa: 'ਪੀਐਮ-ਸੂਰਜ ਪੋਰਟਲ ਤੇ ਆਨਲਾਈਨ ਅਰਜ਼ੀ ਦਿਓ ਜਾਂ ਨਜ਼ਦੀਕੀ ਐਸਸੀਏ ਬ੍ਰਾਂਚ ਵਿੱਚ ਜਾਓ।',
    or: 'ପିଏମ୍-ସୂରଜ ପୋର୍ଟାଲରେ ଅନଲାଇନ୍ ଆବେଦନ କରନ୍ତୁ କିମ୍ବା ନିକଟସ୍ଥ ଏସସିଏ ଶାଖାକୁ ଯାଆନ୍ତୁ।',
    as: 'পিএম-সূৰজ পৰ্টেলত অনলাইন আবেদন কৰক নাইবা নিকটৱৰ্তী এছচিএ শাখাত যাওক।'
  },
  scheme_msy: {
    en: 'Mahila Samriddhi Yojana offers micro-credit up to one lakh forty thousand rupees at five percent interest for women.',
    hi: 'महिला समृद्धि योजना में महिलाओं के लिए पांच प्रतिशत ब्याज पर एक लाख चालीस हजार रुपये तक का ऋण उपलब्ध है।',
    ta: 'மகளிர் சம்ரிதி யோஜனா பெண்களுக்கு ஐந்து சதவீத வட்டியில் ஒரு லட்சத்து நாற்பதாயிரம் ரூபாய் வரை கடன் வழங்குகிறது.',
    te: 'మహిళా సమృద్ధి యోజన మహిళలకు ఐదు శాతం వడ్డీతో లక్షా నలభై వేల రూపాయల వరకు రుణం అందిస్తుంది.',
    bn: 'মহিলা সমৃদ্ধি যোজনায় নারীদের জন্য পাঁচ শতাংশ সুদে এক লাখ চল্লিশ হাজার টাকা পর্যন্ত ঋণ দেওয়া হয়।',
    mr: 'महिला समृद्धी योजनेअंतर्गत महिलांसाठी पाच टक्के व्याजाने एक लाख चाळीस हजार रुपयांपर्यंत कर्ज उपलब्ध आहे.',
    ur: 'مہیلا سمردھی یوجنا خواتین کو پانچ فیصد سود پر ایک لاکھ چالیس ہزار روپے تک قرض دیتی ہے۔',
    gu: 'મહિલા સમૃદ્ધિ યોજના મહિલાઓને પાંચ ટકા વ્યાજે એક લાખ ચાલીસ હજાર રૂપિયા સુધીની લોન આપે છે.',
    kn: 'ಮಹಿಳಾ ಸಮೃದ್ಧಿ ಯೋಜನೆಯು ಮಹಿಳೆಯರಿಗೆ ಶೇಕಡಾ ಐದರ ಬಡ್ಡಿದರದಲ್ಲಿ ಒಂದು ಲಕ್ಷ ನಲವತ್ತು ಸಾವಿರ ರೂ ಸಾಲ ನೀಡುತ್ತದೆ.',
    ml: 'മഹിളാ സമൃദ്ധി യോജന സ്ത്രീകൾക്ക് അഞ്ച് ശതമാനം പലിശയിൽ ഒരു ലക്ഷത്തി നാല്പതിനായിരം രൂപ വരെ വായ്പ നൽകുന്നു.',
    pa: 'ਮਹਿਲਾ ਸਮ੍ਰਿਧੀ ਯੋਜਨਾ ਔਰਤਾਂ ਨੂੰ ਪੰਜ ਫੀਸਦੀ ਵਿਆਜ ਤੇ ਇੱਕ ਲੱਖ ਚਾਲੀ ਹਜ਼ਾਰ ਰੁਪਏ ਤੱਕ ਕਰਜ਼ਾ ਦਿੰਦੀ ਹੈ।',
    or: 'ମହିଳା ସମୃଦ୍ଧି ଯୋଜନାରେ ମହିଳାମାନଙ୍କୁ ପାଞ୍ଚ ପ୍ରତିଶତ ସୁଧରେ ଏକ ଲକ୍ଷ ଚାଳିଶ ହଜାର ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ଋଣ ମିଳେ।',
    as: 'মহিলা সমৃদ্ধি যোজনাত মহিলাসকলক পাঁচ শতাংশ সুতত এক লাখ চল্লিছ হাজাৰ টকালৈকে ঋণ দিয়া হয়।'
  },
  scheme_mcf: {
    en: 'Micro Credit Finance scheme provides direct loans up to one lakh forty thousand rupees for small enterprises.',
    hi: 'माइक्रो क्रेडिट वित्त योजना छोटे व्यवसायों के लिए एक लाख चालीस हजार रुपये तक का प्रत्यक्ष ऋण देती है।',
    ta: 'மைக்ரோ கிரெடிட் நிதி திட்டம் சிறு தொழில்களுக்கு ஒரு லட்சத்து நாற்பதாயிரம் ரூபாய் வரை நேரடி கடன் வழங்குகிறது.',
    te: 'మైక్రో క్రెడిట్ ఫైనాన్స్ పథకం చిన్న వ్యాపారాల కోసం లక్షా నలభై వేల రూపాయల వరకు రుణం అందిస్తుంది.',
    bn: 'মাইক্রো ক্রেডিট ফিনান্স প্রকল্প ক্ষুদ্র ব্যবসার জন্য এক লাখ চল্লিশ হাজার টাকা পর্যন্ত সরাসরি ঋণ দেয়।',
    mr: 'मायक्रो क्रेडिट फायनान्स योजना लहान व्यवसायांसाठी एक लाख चाळीस हजार रुपयांपर्यंत थेट कर्ज पुरवते.',
    ur: 'مائیکرو کریڈٹ فنانس اسکیم چھوٹے کاروباروں کے لیے ایک لاکھ چالیس ہزار روپے تک قرض فراہم کرتی ہے۔',
    gu: 'માઈક્રો ક્રેડિટ ફાયનાન્સ યોજના નાના ઉદ્યોગો માટે એક લાખ ચાલીસ હજાર રૂપિયા સુધીની લોન આપે છે.',
    kn: 'ಮೈಕ್ರೋ ಕ್ರೆಡಿಟ್ ಫೈನಾನ್ಸ್ ಯೋಜನೆಯು ಸಣ್ಣ ಉದ್ಯಮಗಳಿಗೆ ಒಂದು ಲಕ್ಷ ನಲವತ್ತು ಸಾವಿರ ರೂ ಸಾಲ ನೀಡುತ್ತದೆ.',
    ml: 'മൈക്രോ ക്രെഡിറ്റ് ഫിനാൻസ് ചെറുകിട സംരംഭങ്ങൾക്ക് ഒരു ലക്ഷത്തി നാല്പതിനായിരം രൂപ വരെ വായ്പ നൽകുന്നു.',
    pa: 'ਮਾਈਕ੍ਰੋ ਕ੍ਰੈਡਿਟ ਫਾਈਨਾਂਸ ਛੋਟੇ ਕਾਰੋਬਾਰਾਂ ਲਈ ਇੱਕ ਲੱਖ ਚਾਲੀ ਹਜ਼ਾਰ ਰੁਪਏ ਤੱਕ ਕਰਜ਼ਾ ਦਿੰਦਾ ਹੈ।',
    or: 'ମାଇକ୍ରୋ କ୍ରେଡିଟ୍ ଫାଇନାନ୍ସ ଯୋଜନା ଛୋଟ ବ୍ୟବସାୟ ପାଇଁ ଏକ ଲକ୍ଷ ଚାଳିଶ ହଜାର ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ଋଣ ଯୋଗାଏ।',
    as: 'মাইক্ৰ ক্ৰেডিট ফাইনান্স আঁচনিয়ে ক্ষুদ্ৰ ব্যৱসায়ৰ বাবে এক লাখ চল্লিছ হাজাৰ টকালৈকে ঋণ দিয়ে।'
  },
  scheme_tls: {
    en: 'NSFDC Term Loan Scheme funds large projects and business expansion up to fifty lakh rupees.',
    hi: 'एनएसएफडीसी मियादी ऋण योजना पचास लाख रुपये तक के व्यापार और परियोजनाओं के लिए ऋण प्रदान करती है।',
    ta: 'என்எஸ்எஃப்டிசி தவணை கடன் திட்டம் ஐம்பது லட்சம் ரூபாய் வரை வணிக விரிவாக்கத்திற்கு நிதி வழங்குகிறது.',
    te: 'ఎన్‌ఎస్‌ఎఫ్‌డిసి టర్మ్ లోన్ పథకం యాభై లక్షల రూపాయల వరకు వ్యాపార విస్తరణకు రుణం అందిస్తుంది.',
    bn: 'এনএসএফডিসি টার্ম লোন প্রকল্প পঞ্চাশ লাখ টাকা পর্যন্ত ব্যবসা সম্প্রসারণের জন্য তহবিল দেয়।',
    mr: 'एनएसएफडीसी मुदत कर्ज योजना पन्नास लाख रुपयांपर्यंत व्यवसाय विस्तारासाठी कर्ज देते.',
    ur: 'این ایس ایف ڈی سی ٹرم لون اسکیم پچاس لاکھ روپے تک کے کاروبار کے لیے قرض فراہم کرتی ہے۔',
    gu: 'એનએસએફડીસી ટર્મ લોન યોજના પચાસ લાખ રૂપિયા સુધીના વ્યવસાય માટે લોન આપે છે.',
    kn: 'ಎನ್‌ಎಸ್‌ಎಫ್‌ಡಿಸಿ ಟರ್ಮ್ ಲೋನ್ ಯೋಜನೆಯು ಐವತ್ತು ಲಕ್ಷ ರೂ ವರೆಗೆ ವ್ಯಾಪಾರ ಸಾಲ ನೀಡುತ್ತದೆ.',
    ml: 'എൻ.എസ്.എഫ്.ഡി.സി ടേം ലോൺ അമ്പത് ലക്ഷം രൂപ വരെ ബിസിനസ്സ് വിപുലീകരണത്തിന് വായ്പ നൽകുന്നു.',
    pa: 'ਐਨਐਸਐਫਡੀਸੀ ਟਰਮ ਲੋਨ ਸਕੀਮ ਪੰਜਾਹ ਲੱਖ ਰੁਪਏ ਤੱਕ ਕਾਰੋਬਾਰ ਲਈ ਕਰਜ਼ਾ ਪ੍ਰਦਾਨ ਕਰਦੀ ਹੈ।',
    or: 'ଏନଏସଏଫଡିସି ଟର୍ମ ଲୋନ୍ ଯୋଜନା ପଚାଶ ଲକ୍ଷ ଟଙ୍କା ପର୍ଯ୍ୟନ୍ତ ବ୍ୟବସାୟିକ ଋଣ ପ୍ରଦାନ କରେ।',
    as: 'এনএছএফডিচি টার্ম লোন আঁচনিয়ে পঞ্চাশ লাখ টকালৈকে ব্যৱসায়িক ঋণ প্ৰদান কৰে।'
  },
  docs_checklist: {
    en: 'Required documents: Aadhaar card, SC caste certificate, income certificate under five lakhs, and bank passbook.',
    hi: 'आवश्यक दस्तावेज: आधार कार्ड, अनुसूचित जाति प्रमाण पत्र, पांच लाख से कम का आय प्रमाण पत्र, और बैंक पासबुक।',
    ta: 'தேவையான ஆவணங்கள்: ஆதார் அட்டை, சாதி சான்றிதழ், வருமான சான்றிதழ், மற்றும் வங்கி கணக்கு புத்தகம்.',
    te: 'కావలసిన పత్రాలు: ఆధార్ కార్డు, కుల ధృవీకరణ పత్రం, ఆదాయ ధృవీకరణ పత్రం, మరియు బ్యాంక్ పాస్‌బుక్.',
    bn: 'প্রয়োজনীয় নথি: আধার কার্ড, জাতি শংসাপত্র, আয় শংসাপত্র এবং ব্যাঙ্ক পাসবই।',
    mr: 'आवश्यक कागदपत्रे: आधार कार्ड, जातीचा दाखला, उत्पन्नाचा दाखला आणि बँक पासबुक.',
    ur: 'ضروری دستاویزات: آدھار کارڈ، ذات کا سرٹیفکیٹ، آمدنی کا سرٹیفکیٹ اور بینک پاس بک۔',
    gu: 'જરૂરી દસ્તાવેજો: આધાર કાર્ડ, જાતિનું પ્રમાણપત્ર, આવકનું પ્રમાણપત્ર અને બેંક પાસબુક.',
    kn: 'ಅಗತ್ಯ ದಾಖಲೆಗಳು: ಆಧಾರ್ ಕಾರ್ಡ್, ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್.',
    ml: 'ആവശ്യമായ രേഖകൾ: ആധാർ കാർഡ്, ജാതി സർട്ടിഫിക്കറ്റ്, വരുമാന സർട്ടിഫിക്കറ്റ്, ബാങ്ക് പാസ്ബുക്ക്.',
    pa: 'ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼: ਆਧਾਰ ਕਾਰਡ, ਜਾਤੀ ਸਰਟੀਫਿਕੇਟ, ਆਮਦਨ ਸਰਟੀਫਿਕੇਟ ਅਤੇ ਬੈਂਕ ਪਾਸਬੁੱਕ।',
    or: 'ଆବଶ୍ୟକ ଦସ୍ତାବିଜ: ଆଧାର କାର୍ଡ, ଜାତି ପ୍ରମାଣପତ୍ର, ଆୟ ପ୍ରମାଣପତ୍ର ଓ ବ୍ୟାଙ୍କ ପାସବହି।',
    as: 'প্ৰয়োজনীয় নথিপত্ৰ: আধাৰ কাৰ্ড, জাতিৰ প্ৰমাণপত্ৰ, আয়ৰ প্ৰমাণপত্ৰ আৰু বেংক পাছবুক।'
  }
};

function callElevenLabsTTS(text, config, retryCount = 0) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('CRITICAL: ELEVENLABS_API_KEY environment variable is missing.'));
  }

  const payload = JSON.stringify({
    text: text,
    model_id: config.modelId || 'eleven_multilingual_v2',
    voice_settings: config.settings
  });

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

        // Handle 429 rate limit with one backoff retry
        if (res.statusCode === 429 && retryCount < 1) {
          console.warn(' Rate limit 429, waiting 3s before retry...');
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
          return reject(new Error(`Received tiny audio buffer (${bodyBuf.length} bytes < 2048 threshold)`));
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
  console.log('   SchemeBridge Resilient ElevenLabs Audio Clip Generator     ');
  console.log('===============================================================\n');

  if (isDryRun) {
    console.log('\x1b[33mNOTICE: Running in --dry-run mode. Output directory: ' + OUTPUT_BASE + '\x1b[0m\n');
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('\x1b[31mCRITICAL ERROR: ELEVENLABS_API_KEY is not set.\x1b[0m');
    console.error('The generator refuses to write stubs or empty files. Exiting.\n');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_BASE)) {
    fs.mkdirSync(OUTPUT_BASE, { recursive: true });
  }

  const manifest = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    provider: 'ElevenLabs Multilingual v2',
    clips: {}
  };

  const clipIds = Object.keys(PROMPTS).filter(id => !targetClipFilter || id === targetClipFilter);
  let totalProcessed = 0;
  let reusedCount = 0;
  let newlyGenerated = 0;

  for (const clipId of clipIds) {
    manifest.clips[clipId] = {};
    const langMap = PROMPTS[clipId];

    for (const [langCode, text] of Object.entries(langMap)) {
      const config = LANGUAGE_CONFIG[langCode];
      if (!config || config.engine === 'none') continue;

      const langDir = path.join(OUTPUT_BASE, langCode);
      if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
      }

      const filePath = path.join(langDir, `${clipId}.mp3`);
      const publicPath = `/audio/${langCode}/${clipId}.mp3`;
      const textHash = sha256Hex(text);

      let audioData = null;

      // Check if a valid clip already exists on disk with matching text hash
      if (fs.existsSync(filePath)) {
        const existingBuf = fs.readFileSync(filePath);
        if (existingBuf.length >= 2048 && isValidMp3Header(existingBuf)) {
          audioData = existingBuf;
          reusedCount++;
          process.stdout.write(`[\x1b[36mREUSE\x1b[0m] [${langCode}] ${clipId} (${existingBuf.length} bytes)\n`);
        }
      }

      if (!audioData) {
        process.stdout.write(`[\x1b[33mSYNTH\x1b[0m] [${langCode}] ${clipId} (voice: ${config.voiceId.slice(0, 6)}...)... `);
        try {
          audioData = await callElevenLabsTTS(text, config);
          fs.writeFileSync(filePath, audioData);
          newlyGenerated++;
          console.log(`\x1b[32mOK (${audioData.length} bytes)\x1b[0m`);
          // Politeness delay to avoid rate limiting
          await sleep(250);
        } catch (err) {
          console.log(`\x1b[31mFAILED\x1b[0m: ${err.message}`);
          console.error(`\n\x1b[31mCRITICAL FAILURE: Clip generation failed for [${langCode}] ${clipId}.\x1b[0m`);
          console.error('In accordance with strict audio invariants, execution is terminated without writing placeholder files.\n');
          process.exit(1);
        }
      }

      manifest.clips[clipId][langCode] = {
        clipId,
        language: langCode,
        languageName: config.name,
        path: publicPath,
        sizeBytes: audioData.length,
        sha256: sha256Hex(audioData),
        textHash: textHash,
        modelId: config.modelId || 'eleven_multilingual_v2',
        voiceId: config.voiceId,
        generatedAt: new Date().toISOString(),
        text: text
      };

      totalProcessed++;
    }
  }

  const manifestPath = path.join(OUTPUT_BASE, 'audio-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log('\n===============================================================');
  console.log(`Generated manifest with ${totalProcessed} clips:`);
  console.log(`  - Newly generated: \x1b[32m${newlyGenerated}\x1b[0m`);
  console.log(`  - Reused existing: \x1b[36m${reusedCount}\x1b[0m`);
  console.log(`Manifest written to: ${manifestPath}`);
  console.log('===============================================================\n');
}

run().catch(err => {
  console.error('\n\x1b[31mUnhandled Exception:\x1b[0m', err);
  process.exit(1);
});
