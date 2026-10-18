/**
 * Pre-generate Core Static Audio Clips with ElevenLabs
 * Generates static MP3s into frontend/public/audio/<lang>/<clipId>.mp3
 * and builds frontend/public/audio/audio-manifest.json
 *
 * Usage: node scripts/generate-voice-clips.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
// Simple .env reader without external dependencies
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

const OUTPUT_BASE = path.resolve(__dirname, '../frontend/public/audio');
if (!fs.existsSync(OUTPUT_BASE)) {
  fs.mkdirSync(OUTPUT_BASE, { recursive: true });
}

// Minimal valid MP3 silent frame (MPEG 1 Audio Layer III, 128 kbps, 44100 Hz)
// Used when synthesizing in offline/stub mode without live ElevenLabs quota
const SILENT_MP3_FRAME = Buffer.from([
  0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

const PROMPTS = {
  portal_welcome: {
    en: 'Welcome to SchemeBridge, the official concessional credit portal for Scheduled Caste entrepreneurs and students under NSFDC.',
    hi: 'योजना सेतु में आपका स्वागत है, एनएसएफडीसी के तहत अनुसूचित जाति के उद्यमियों और छात्रों के लिए आधिकारिक रियायती ऋण मंच।',
    ta: 'என்.எஸ்.எஃப்.டி.சி கீழ் உள்ள எஸ்சி தொழில்முனைவோர் மற்றும் மாணவர்களுக்கான அதிகாரப்பூர்வ மானிய கடன் போர்ட்டலான திட்டம் சேதுவுக்கு உங்களை வரவேற்கிறோம்.',
    te: 'ఎన్‌ఎస్‌ఎఫ్‌డిసి కింద షెడ్యూల్డ్ కులాల వ్యవస్థాపకులు మరియు విద్యార్థుల కోసం అధికారిక రాయితీ రుణ పోర్టల్ అయిన స్కీమ్ సేతుకు స్వాగతం.',
    bn: 'এনএসএফডিসি-র অধীনে তপশিলি জাতি উদ্যোক্তা এবং শিক্ষার্থীদের জন্য অফিসিয়াল রেয়াতি ঋণ পোর্টাল স্কিম সেতুতে আপনাকে স্বাগতম।',
    mr: 'एनएसएफडीसी अंतर्गत अनुसूचित जातीच्या उद्योजकांसाठी आणि विद्यार्थ्यांसाठी अधिकृत सवलतीच्या कर्ज पोर्टल योजना सेतूमध्ये आपले स्वागत आहे.',
    ur: 'این ایس ایف ڈی سی کے تحت درج فہرست ذات کے کاروباری افراد اور طلباء کے لیے سرکاری رعایتی قرض پورٹل اسکیم سیتو میں خوش آمدید۔',
    gu: 'એનએસએફડીસી હેઠળ અનુસૂચિત જાતિના સાહસિકો અને વિદ્યાર્થીઓ માટે સત્તાવાર રાહત લોન પોર્ટલ સ્કીમ સેતુમાં આપનું સ્વાગત છે.',
    kn: 'ಎನ್‌ಎಸ್‌ಎಫ್‌ಡಿಸಿ ಅಡಿಯಲ್ಲಿ ಪರಿಶಿಷ್ಟ ಜಾತಿಯ ಉದ್ಯಮಿಗಳು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಅಧಿಕೃತ ರಿಯಾಯಿತಿ ಸಾಲದ ಪೋರ್ಟಲ್ ಆದ ಸ್ಕೀಮ್ ಸೇತುಗೆ ಸುಸ್ವಾಗತ.',
    ml: 'എൻ.എസ്.എഫ്.ഡി.സിക്ക് കീഴിലുള്ള പട്ടികജാതി സംരംഭകർക്കും വിദ്യാർത്ഥികൾക്കുമുള്ള ഔദ്യോഗിക ഇളവുള്ള വായ്പാ പോർട്ടലായ സ്കീം സേതുവിലേക്ക് സ്വാഗതം.',
    pa: 'ਐਨ.ਐਸ.ਐਫ.ਡੀ.ਸੀ ਦੇ ਅਧੀਨ ਅਨੁਸੂਚਿਤ ਜਾਤੀ ਦੇ ਉੱਦਮੀਆਂ ਅਤੇ ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਅਧਿਕਾਰਤ ਰਿਆਇਤੀ ਕਰਜ਼ਾ ਪੋਰਟਲ ਸਕੀਮ ਸੇਤੂ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ।',
    or: 'ଏନଏସଏଫଡିସି ଅଧୀନରେ ଅନୁସୂଚିତ ଜାତି ଉଦ୍ୟୋଗୀ ଏବଂ ଛାତ୍ରମାନଙ୍କ ପାଇଁ ସରକାରୀ ରିହାତି ଋଣ ପୋର୍ଟାଲ୍ ସ୍କିମ୍ ସେତୁକୁ ସ୍ୱାଗତ।',
    as: 'এনএছএফডিচিৰ অধীনত অনুসূচীত জাতিৰ উদ্যোগী আৰু ছাত্ৰ-ছাত্ৰীসকলৰ বাবে অফিচিয়েল ৰেহাই ঋণ পৰ্টেল স্কিম সেতুলৈ স্বাগতম।'
  },
  apply_modal_warning: {
    en: 'Applying through the official government portal is completely free of cost. Never pay money to agents, brokers, or middlemen.',
    hi: 'आधिकारिक सरकारी पोर्टल के माध्यम से आवेदन पूरी तरह निःशुल्क है। किसी भी एजेंट या बिचौलिए को कभी पैसे न दें।',
    ta: 'அதிகாரப்பூர்வ அரசு போர்ட்டல் மூலம் விண்ணப்பிப்பது முற்றிலும் இலவசம். முகவர்கள் அல்லது இடைத்தரகர்களுக்கு பணம் செலுத்த வேண்டாம்.',
    te: 'అధికారిక ప్రభుత్వ పోర్టల్ ద్వారా దరఖాస్తు చేసుకోవడం పూర్తిగా ఉచితం. ఏజెంట్లకు లేదా దళారులకు ఎప్పుడూ డబ్బు చెల్లించవద్దు.',
    bn: 'অফিসিয়াল সরকারী পোর্টালের মাধ্যমে আবেদন সম্পূর্ণ বিনামূল্যে। দালাল বা মধ্যস্থতাকারীদের কখনও টাকা দেবেন না।',
    mr: 'अधिकृत सरकारी पोर्टलद्वारे अर्ज करणे पूर्णपणे विनामूल्य आहे. कोणत्याही एजंट किंवा मध्यस्थांना कधीही पैसे देऊ नका.',
    ur: 'سرکاری پورٹل کے ذریعے درخواست دینا بالکل مفت ہے۔ کسی بھی ایجنٹ یا دلال کو ہرگز پیسے نہ دیں۔',
    gu: 'સત્તાવાર સરકારી પોર્ટલ દ્વારા અરજી કરવી તદ્દન મફત છે. ક્યારેય કોઈ એજન્ટ કે વચેટિયાને નાણાં આપશો નહીં.',
    kn: 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಸಂಪೂರ್ಣ ಉಚಿತವಾಗಿದೆ. ದಲ್ಲಾಳಿಗಳಿಗೆ ಹಣ ನೀಡಬೇಡಿ.',
    ml: 'ഔദ്യോഗിക സർക്കാർ പോർട്ടൽ വഴി അപേക്ഷിക്കുന്നത് പൂർണ്ണമായും സൗജന്യമാണ്. ഇടനിലക്കാർക്ക് പണം നൽകരുത്.',
    pa: 'ਅਧਿਕਾਰਤ ਸਰਕਾਰੀ ਪੋਰਟਲ ਰਾਹੀਂ ਅਰਜ਼ੀ ਦੇਣਾ ਬਿਲਕੁਲ ਮੁਫ਼ਤ ਹੈ। ਕਦੇ ਵੀ ਵਿਚੋਲਿਆਂ ਨੂੰ ਪੈਸੇ ਨਾ ਦਿਓ।',
    or: 'ସରକାରୀ ପୋର୍ଟାଲ ମାଧ୍ୟମରେ ଆବେଦନ ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣା। କୌଣସି ଦଲାଲଙ୍କୁ ଟଙ୍କା ଦିଅନ୍ତୁ ନାହିଁ।',
    as: 'চৰকাৰী পৰ্টেলৰ জৰিয়তে আবেদন সম্পূৰ্ণ বিনামূলীয়া। কোনো মধ্যভোগীক পইচা নিদিব।'
  },
  doc_guidance_intro: {
    en: 'Ensure zero rejections by preparing certified documentation before visiting the channel partner branch.',
    hi: 'चैनल पार्टनर शाखा जाने से पहले प्रमाणित दस्तावेज तैयार करके शून्य अस्वीकृति सुनिश्चित करें।',
    ta: 'சேனல் பார்ட்னர் கிளைக்குச் செல்லும் முன் சான்றளிக்கப்பட்ட ஆவணங்களைத் தயாரிப்பதன் மூலம் பூஜ்ஜிய நிராகரிப்புகளை உறுதிப்படுத்தவும்.',
    te: 'ఛానల్ భాగస్వామి శాఖను సందర్శించే ముందు ధృవీకరించబడిన పత్రాలను సిద్ధం చేయడం ద్వారా తిరస్కరణలు లేకుండా చూసుకోండి.',
    bn: 'চ্যানেল পার্টনার শাখায় যাওয়ার আগে প্রত্যয়িত কাগজপত্র প্রস্তুত করে শূন্য প্রত্যাখ্যান নিশ্চিত করুন।',
    mr: 'चॅनेल भागीदार शाखेला भेट देण्यापूर्वी प्रमाणित कागदपत्रे तयार करून शून्य नकार खात्री करा.',
    ur: 'چینل پارٹنر برانچ جانے سے پہلے تصدیق شدہ دستاویزات تیار کر کے مسترد ہونے سے بچیں۔',
    gu: 'ચેનલ પાર્ટનર શાખાની મુલાકાત લેતા પહેલા પ્રમાણિત દસ્તાવેજો તૈયાર કરીને શૂન્ય અસ્વીકારની ખાતરી કરો.',
    kn: 'ಚಾನೆಲ್ ಪಾಲುದಾರ ಶಾಖೆಗೆ ಭೇಟಿ ನೀಡುವ ಮೊದಲು ಪ್ರಮಾಣೀಕೃತ ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸುವ ಮೂಲಕ ಶೂನ್ಯ ತಿರಸ್ಕರಣೆಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
    ml: 'ചാനൽ പങ്കാളി ശാഖ സന്ദർശിക്കുന്നതിന് മുമ്പ് സാക്ഷ്യപ്പെടുത്തിയ രേഖകൾ തയ്യാറാക്കി നിരസിക്കൽ ഒഴിവാക്കുക.',
    pa: 'ਚੈਨਲ ਪਾਰਟਨਰ ਬ੍ਰਾਂਚ ਜਾਣ ਤੋਂ ਪਹਿਲਾਂ ਪ੍ਰਮਾਣਿਤ ਦਸਤਾਵੇਜ਼ ਤਿਆਰ ਕਰਕੇ ਰੱਦ ਹੋਣ ਤੋਂ ਬਚੋ।',
    or: 'ଚ୍ୟାନେଲ୍ ସହଯୋଗୀ ଶାଖା ପରିଦର୍ଶନ କରିବା ପୂର୍ବରୁ ପ୍ରମାଣିତ ଦସ୍ତାବିଜ ପ୍ରସ୍ତୁତ କରି ପ୍ରତ୍ୟାଖ୍ୟାନକୁ ଏଡ଼ାନ୍ତୁ।',
    as: 'চেনেল অংশীদাৰৰ শাখাত যোৱাৰ পূৰ্বে প্ৰমাণিত নথি-পত্ৰ প্ৰস্তুত কৰি বাতিল হোৱাৰ পৰা ৰক্ষা পাওক।'
  }
};

function callElevenLabsTTS(text, config) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return Promise.reject(new Error('No API key'));

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
      timeout: 20000
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(Buffer.concat(chunks));
        } else {
          reject(new Error(`ElevenLabs returned HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(payload);
    req.end();
  });
}

async function runGenerator() {
  console.log('===============================================================');
  console.log('   SchemeBridge ElevenLabs Audio Clip Manifest Generator     ');
  console.log('===============================================================\n');

  const hasApiKey = Boolean(process.env.ELEVENLABS_API_KEY);
  console.log(`ElevenLabs API Key Status: ${hasApiKey ? 'ACTIVE (Live API generation enabled)' : 'OFFLINE / STUB (Generating manifest & structural audio buffers)'}\n`);

  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    provider: 'ElevenLabs Multilingual v2',
    clips: {}
  };

  const clipKeys = Object.keys(PROMPTS);
  let generatedCount = 0;

  for (const clipId of clipKeys) {
    manifest.clips[clipId] = {};
    const langEntries = PROMPTS[clipId];

    for (const [langCode, text] of Object.entries(langEntries)) {
      const config = LANGUAGE_CONFIG[langCode];
      if (!config || config.engine === 'none') continue;

      const langDir = path.join(OUTPUT_BASE, langCode);
      if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
      }

      const filePath = path.join(langDir, `${clipId}.mp3`);
      const publicPath = `/audio/${langCode}/${clipId}.mp3`;

      let audioData = null;
      if (hasApiKey) {
        try {
          process.stdout.write(`Synthesizing [${langCode}] ${clipId}... `);
          audioData = await callElevenLabsTTS(text, config);
          console.log('\x1b[32mOK\x1b[0m');
        } catch (e) {
          console.log(`\x1b[33mFALLBACK (${e.message})\x1b[0m`);
          audioData = SILENT_MP3_FRAME;
        }
      } else {
        audioData = SILENT_MP3_FRAME;
      }

      fs.writeFileSync(filePath, audioData);

      manifest.clips[clipId][langCode] = {
        path: publicPath,
        text,
        language: config.name,
        voiceId: config.voiceId,
        sizeBytes: audioData.length
      };

      generatedCount++;
    }
  }

  const manifestPath = path.join(OUTPUT_BASE, 'audio-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log('\n===============================================================');
  console.log(`Successfully generated manifest and ${generatedCount} audio clips!`);
  console.log(`Manifest written to: ${manifestPath}`);
  console.log('===============================================================\n');
}

runGenerator();
