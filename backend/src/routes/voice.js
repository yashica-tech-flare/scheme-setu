const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { LANGUAGE_CONFIG, FROZEN_LANGUAGES, BROKEN_LANGUAGES, getVoiceConfig, isVoiceSupported } = require('../config/voiceConfig');

// Cache versioning and directory
const CACHE_VERSION = 'v2';
const CACHE_DIR = path.resolve(__dirname, '../../cache/audio');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// In-memory rate limiter: max 20 requests per minute per IP
const ipRateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

// Character budget safeguard (max characters synthesized per server session)
const MAX_SESSION_CHARACTERS = 200000;
let sessionCharactersSynthesized = 0;

// Diagnostic state for GET /api/voice/status (no secrets stored)
let lastElevenLabsDiagnostic = {
  timestamp: null,
  statusCode: null,
  statusMessage: null,
  latencyMs: null
};

// Institutional whitelisted numbers (government national helplines, not personal PII)
const WHITELISTED_PATTERNS = [
  /1800[- ]?11[- ]?2001/g, // National SC/ST Helpline
  /1800[- ]?180[- ]?1551/g, // Kisan/Welfare Helpline
  /1800[- ]?\d{2,3}[- ]?\d{3,4}/g // General toll-free prefixes
];

/**
 * Checks in-memory IP rate limiter.
 * @param {string} ip
 * @returns {boolean} true if allowed, false if exceeded
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const record = ipRateLimits.get(ip) || { count: 0, windowStart: now };

  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.windowStart = now;
    ipRateLimits.set(ip, record);
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  ipRateLimits.set(ip, record);
  return true;
}

/**
 * Audits text for personal identifiable information (PII).
 * Whitelists institutional helplines and loan amounts.
 * Flags personal mobile numbers, Aadhaar, and PAN.
 * @param {string} text
 * @returns {boolean} true if clean
 */
function assertNoPii(text) {
  if (!text) return true;

  // Mask whitelisted institutional numbers before PII inspection
  let sanitized = text;
  WHITELISTED_PATTERNS.forEach(pat => {
    sanitized = sanitized.replace(pat, ' INSTITUTIONAL_HELPLINE ');
  });

  // 12-digit Aadhaar pattern (institutional helplines like 1800 are already masked above)
  if (/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/.test(sanitized)) {
    throw new Error('PII violation: 12-digit Aadhaar-like identifier detected.');
  }

  // 10-character PAN pattern (5 uppercase letters, 4 digits, 1 uppercase letter)
  if (/\b[A-Z]{5}[0-9]{4}[A-Z]\b/i.test(sanitized)) {
    throw new Error('PII violation: Permanent Account Number (PAN) detected.');
  }

  // 10-digit Indian Mobile pattern (starts with 6-9, optional +91 prefix)
  if (/\b(?:\+?91[ -]?)?[6-9]\d{9}\b/.test(sanitized)) {
    throw new Error('PII violation: Personal mobile phone number detected.');
  }

  return true;
}

/**
 * Normalizes numbers and currency for natural Indic TTS pronunciation.
 * E.g., ₹1,40,000 -> 140000 rupees.
 * @param {string} text
 * @returns {string}
 */
function cleanTextForTTS(text) {
  if (!text) return '';
  return text
    .replace(/₹\s*([\d,]+)/g, (_, amt) => `${amt.replace(/,/g, '')} rupees`)
    .replace(/–/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sleep helper for retry backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Maps upstream ElevenLabs HTTP status to stable error codes
 */
function mapElevenLabsError(status, message) {
  if (status === 401) {
    return {
      statusCode: 401,
      code: 'voice_key_invalid',
      message: 'ElevenLabs API key is missing, unauthorized, or invalid.'
    };
  }
  if (status === 402 || status === 403) {
    return {
      statusCode: 403,
      code: 'voice_plan_or_voice_not_allowed',
      message: 'ElevenLabs plan quota exceeded or requested voice is not permitted on this account tier.'
    };
  }
  if (status === 422) {
    return {
      statusCode: 422,
      code: 'voice_bad_model_or_voice',
      message: 'Invalid voice ID or model ID passed to ElevenLabs synthesis.'
    };
  }
  if (status === 429) {
    return {
      statusCode: 429,
      code: 'voice_busy',
      message: 'ElevenLabs voice service is busy with high concurrent traffic. Please retry in a few moments.'
    };
  }
  if (status === 504 || message?.includes('timed out')) {
    return {
      statusCode: 504,
      code: 'voice_timeout',
      message: 'Voice synthesis request timed out after 25 seconds.'
    };
  }
  return {
    statusCode: 502,
    code: 'elevenlabs_error',
    message: message || 'Upstream ElevenLabs speech synthesis error.'
  };
}

/**
 * Calls ElevenLabs Text-to-Speech API with retry on 429.
 * @param {string} text
 * @param {Object} config
 * @param {number} retryCount
 * @returns {Promise<{ audioBuffer: Buffer, latencyMs: number }>}
 */
function synthesizeWithElevenLabs(text, config, retryCount = 0) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Promise.reject(mapElevenLabsError(401, 'ELEVENLABS_API_KEY environment variable not configured'));
  }

  const voiceId = config.voiceId;
  const modelId = config.modelId || 'eleven_multilingual_v2';
  const startTime = Date.now();

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
      path: `/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
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
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', async () => {
        const latencyMs = Date.now() - startTime;
        const bodyBuf = Buffer.concat(chunks);

        lastElevenLabsDiagnostic = {
          timestamp: new Date().toISOString(),
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          latencyMs
        };

        // Retry once on 429 rate limit
        if (res.statusCode === 429 && retryCount < 1) {
          console.warn('[Voice API] Upstream 429 received, applying 1.5s backoff retry...');
          await sleep(1500);
          try {
            const retried = await synthesizeWithElevenLabs(text, config, retryCount + 1);
            return resolve(retried);
          } catch (retryErr) {
            return reject(retryErr);
          }
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          const contentType = res.headers['content-type'] || '';
          if (!contentType.includes('audio')) {
            return reject(mapElevenLabsError(502, `Unexpected Content-Type: ${contentType}`));
          }
          resolve({ audioBuffer: bodyBuf, latencyMs });
        } else {
          let errMsg = `ElevenLabs API error HTTP ${res.statusCode}`;
          try {
            const parsed = JSON.parse(bodyBuf.toString());
            errMsg = parsed.detail?.message || parsed.message || errMsg;
          } catch (_) {}
          reject(mapElevenLabsError(res.statusCode, errMsg));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const latencyMs = Date.now() - startTime;
      lastElevenLabsDiagnostic = {
        timestamp: new Date().toISOString(),
        statusCode: 504,
        statusMessage: 'Gateway Timeout',
        latencyMs
      };
      reject(mapElevenLabsError(504, 'Request timed out after 25s'));
    });

    req.on('error', err => {
      const latencyMs = Date.now() - startTime;
      lastElevenLabsDiagnostic = {
        timestamp: new Date().toISOString(),
        statusCode: 502,
        statusMessage: err.message,
        latencyMs
      };
      reject(mapElevenLabsError(502, err.message));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Calls Sarvam Text-to-Speech API (Bulbul v3) for a single chunk of text.
 */
function callSingleSarvamTTS(text, config) {
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (!sarvamKey) {
    return Promise.reject(new Error('SARVAM_API_KEY environment variable not configured'));
  }
  const startTime = Date.now();
  const sarvamLangMap = {
    te: 'te-IN', bn: 'bn-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'od-IN', hi: 'hi-IN', ta: 'ta-IN', mr: 'mr-IN', en: 'en-IN'
  };
  const targetLang = sarvamLangMap[config.languageCode] || 'hi-IN';
  const speaker = config.speaker || config.voiceId || 'shubh';
  const payload = JSON.stringify({
    text: text,
    inputs: [text],
    language_code: targetLang,
    target_language_code: targetLang,
    speaker: speaker,
    model: 'bulbul:v3',
    target_audio_codec: 'mp3'
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
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const latencyMs = Date.now() - startTime;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString());
            const b64 = data.audios?.[0] || data.audio_base64 || data.audio;
            if (b64) {
              const audioBuffer = Buffer.from(b64, 'base64');
              return resolve({ audioBuffer, latencyMs });
            }
          } catch (e) {}
        }
        reject(new Error(`Sarvam TTS error HTTP ${res.statusCode}`));
      });
    });
    req.on('error', err => reject(err));
    req.write(payload);
    req.end();
  });
}

/**
 * Synthesizes text with Sarvam, chunking long text below Sarvam limit (2500 chars).
 */
async function synthesizeWithSarvam(text, config) {
  if (text.length > 2000) {
    const sentences = text.match(/[^.!?।\n]+[.!?।\n]+/g) || [text];
    const chunks = [];
    let current = '';
    for (const s of sentences) {
      if ((current + s).length > 2000) {
        if (current) chunks.push(current.trim());
        current = s;
      } else {
        current += s;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    const buffers = [];
    let totalLatency = 0;
    for (const chunk of chunks) {
      const res = await callSingleSarvamTTS(chunk, config);
      buffers.push(res.audioBuffer);
      totalLatency += res.latencyMs;
    }
    return { audioBuffer: Buffer.concat(buffers), latencyMs: totalLatency };
  }
  return callSingleSarvamTTS(text, config);
}

/**
 * Safe logger for speech requests (never logs keys, headers, or raw text)
 */
function logVoiceRequest({ lang, textLength, textHash, cache, status, latencyMs, errorCode }) {
  console.log(JSON.stringify({
    event: 'voice_speak_request',
    time: new Date().toISOString(),
    lang,
    textLength,
    textHash,
    cache,
    status,
    latencyMs,
    ...(errorCode ? { errorCode } : {})
  }));
}

/**
 * POST /api/voice/speak
 * Synthesizes dynamic scheme text or guidance into audio using server-authoritative voice configuration.
 */
router.post('/speak', async (req, res) => {
  const reqStartTime = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // 1. In-memory Rate Limiting Check
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      code: 'voice_busy',
      message: 'Too many voice requests. Please wait a minute before requesting audio again.'
    });
  }

  const { text, languageCode } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({
      error: 'text_required',
      code: 'text_required',
      message: 'The text field is required for synthesis.'
    });
  }

  const cleanText = cleanTextForTTS(text);
  const textHash = crypto.createHash('sha256').update(cleanText).digest('hex').slice(0, 16);

  if (cleanText.length > 900) {
    return res.status(400).json({
      error: 'text_too_long',
      code: 'text_too_long',
      message: 'Text exceeds maximum limit of 900 characters.',
      length: cleanText.length
    });
  }

  // 2. Enforce zero PII
  try {
    assertNoPii(cleanText);
  } catch (piiErr) {
    return res.status(400).json({
      error: 'pii_detected',
      code: 'pii_detected',
      message: piiErr.message
    });
  }

  // 3. Language configuration & support check
  const lang = String(languageCode || 'en').toLowerCase().trim().split(/[-_]/)[0];
  const config = getVoiceConfig(lang);

  if (config.status === 'unavailable' || config.engine === 'none') {
    return res.status(400).json({
      error: 'language_not_supported',
      code: 'voice_unavailable',
      message: 'Voice is not available in this language yet',
      status: 'unavailable',
      engine: 'none'
    });
  }

  // 4. Check disk cache keyed by sha256(lang + provider + model + speaker + text)
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${CACHE_VERSION}:${lang}:${config.provider || 'none'}:${config.model || config.modelId || 'none'}:${config.speaker || config.voiceId || 'none'}:${cleanText}`)
    .digest('hex');
  const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);

  if (fs.existsSync(cacheFilePath)) {
    const latencyMs = Date.now() - reqStartTime;
    logVoiceRequest({
      lang,
      textLength: cleanText.length,
      textHash,
      cache: 'HIT',
      status: 200,
      latencyMs
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Voice-Cache', 'HIT');
    res.setHeader('X-Voice-Provider', config.provider || 'none');
    res.setHeader('X-Voice-Model', config.model || config.modelId || 'none');
    res.setHeader('X-Voice-Id', config.speaker || config.voiceId || 'none');
    res.setHeader('X-Voice-Lang', lang);
    res.setHeader('X-Voice-Status', config.status || 'verified');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    const stream = fs.createReadStream(cacheFilePath);
    return stream.pipe(res);
  }

  // 5. Check provider keys
  if (config.provider === 'sarvam') {
    if (!process.env.SARVAM_API_KEY) {
      return res.status(503).json({
        error: 'voice_key_missing',
        code: 'voice_key_invalid',
        message: 'Sarvam voice engine key not configured.'
      });
    }
  } else if (!process.env.ELEVENLABS_API_KEY) {
    const isFrozen = FROZEN_LANGUAGES.includes(lang);
    const allowBrowserFallback = isFrozen && ['en', 'hi'].includes(lang);
    return res.status(503).json({
      error: 'voice_key_missing',
      code: 'voice_key_invalid',
      ...(allowBrowserFallback ? { fallback: 'speechSynthesis' } : {}),
      message: 'ElevenLabs voice engine is not active (missing backend API key).'
    });
  }

  // 6. Character budget check (counts only live network calls)
  if (sessionCharactersSynthesized + cleanText.length > MAX_SESSION_CHARACTERS) {
    return res.status(503).json({
      error: 'budget_exceeded',
      code: 'voice_busy',
      message: 'Server voice synthesis character budget reached.'
    });
  }

  // 7. Live synthesis with configured provider
  try {
    let result;
    if (config.provider === 'sarvam') {
      result = await synthesizeWithSarvam(cleanText, config);
    } else {
      result = await synthesizeWithElevenLabs(cleanText, config);
    }
    const { audioBuffer, latencyMs } = result;
    sessionCharactersSynthesized += cleanText.length;

    // Cache the output buffer
    try {
      fs.writeFileSync(cacheFilePath, audioBuffer);
    } catch (writeErr) {
      console.warn('[Voice Cache] Failed writing audio cache file:', writeErr.message);
    }

    logVoiceRequest({
      lang,
      textLength: cleanText.length,
      textHash,
      cache: 'MISS',
      status: 200,
      latencyMs
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Voice-Cache', 'MISS');
    res.setHeader('X-Voice-Provider', config.provider || 'none');
    res.setHeader('X-Voice-Model', config.model || config.modelId || 'none');
    res.setHeader('X-Voice-Id', config.speaker || config.voiceId || 'none');
    res.setHeader('X-Voice-Lang', lang);
    res.setHeader('X-Voice-Status', config.status || 'verified');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    return res.send(audioBuffer);
  } catch (err) {
    const latencyMs = Date.now() - reqStartTime;
    const statusCode = err.statusCode || 502;
    const errCode = err.code || 'elevenlabs_error';

    logVoiceRequest({
      lang,
      textLength: cleanText.length,
      textHash,
      cache: 'MISS',
      status: statusCode,
      latencyMs,
      errorCode: errCode
    });

    const isFrozen = FROZEN_LANGUAGES.includes(lang);
    const allowBrowserFallback = isFrozen && ['en', 'hi'].includes(lang);

    return res.status(statusCode).json({
      error: errCode,
      code: errCode,
      ...(allowBrowserFallback ? { fallback: 'speechSynthesis' } : {}),
      message: err.message
    });
  }
});

/**
 * GET /api/voice/status
 * Diagnostic endpoint with zero secrets.
 */
router.get('/status', (req, res) => {
  const languages = Object.entries(LANGUAGE_CONFIG).map(([code, cfg]) => ({
    code,
    name: cfg.name,
    provider: cfg.provider,
    model: cfg.model || cfg.modelId,
    status: cfg.status,
    engine: cfg.engine
  }));

  let cachedClips = 0;
  try {
    cachedClips = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.mp3')).length;
  } catch (_) {}

  const manifestPath = path.resolve(__dirname, '../../../frontend/public/audio/audio-manifest.json');
  const manifestFound = fs.existsSync(manifestPath);

  const supportedLanguages = Object.entries(LANGUAGE_CONFIG)
    .filter(([code]) => ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'ur', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'bho', 'raj', 'mag', 'hne', 'bgc'].includes(code))
    .map(([code, cfg]) => ({ code, name: cfg.name, quality: cfg.status, provider: cfg.provider }));

  const disabledLanguages = Object.entries(LANGUAGE_CONFIG)
    .filter(([code]) => !['en', 'hi', 'ta', 'te', 'bn', 'mr', 'ur', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'bho', 'raj', 'mag', 'hne', 'bgc'].includes(code))
    .map(([code, cfg]) => ({ code, name: cfg.name, reason: cfg.reason || 'Not supported by ElevenLabs speech synthesis.' }));

  res.json({
    enabled: true,
    provider: 'ElevenLabs / Sarvam AI Hybrid Engine',
    supportedCount: supportedLanguages.length,
    supportedLanguages,
    disabledCount: disabledLanguages.length,
    disabledLanguages,
    keyConfigured: Boolean(process.env.ELEVENLABS_API_KEY),
    sarvamConfigured: Boolean(process.env.SARVAM_API_KEY),
    elevenKeyConfigured: Boolean(process.env.ELEVENLABS_API_KEY),
    sarvamKeyConfigured: Boolean(process.env.SARVAM_API_KEY),
    commitHash: process.env.RENDER_GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev',
    manifestFound,
    serverTime: new Date().toISOString(),
    cacheEntryCount: cachedClips,
    lastElevenLabs: lastElevenLabsDiagnostic,
    languages
  });
});

module.exports = router;
