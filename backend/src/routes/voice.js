const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { LANGUAGE_CONFIG, getVoiceConfig, isVoiceSupported } = require('../config/voiceConfig');

// Audio cache directory
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
 * Throws an error if phone numbers, Aadhaar, PAN, or account numbers are detected.
 * @param {string} text
 * @returns {boolean} true if clean
 */
function assertNoPii(text) {
  if (!text) return true;

  // 12-digit Aadhaar pattern
  if (/\b\d{4}\s?\d{4}\s?\d{4}\b/.test(text)) {
    throw new Error('PII violation: 12-digit identifier detected.');
  }

  // 10-character PAN pattern
  if (/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/.test(text)) {
    throw new Error('PII violation: Permanent Account Number (PAN) detected.');
  }

  // 10-digit Indian Mobile pattern
  if (/\b[6-9]\d{9}\b/.test(text)) {
    throw new Error('PII violation: Mobile phone number detected.');
  }

  return true;
}

/**
 * Normalizes numbers and currency for natural TTS pronunciation.
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
 * Calls ElevenLabs Text-to-Speech API.
 * @param {string} text
 * @param {Object} config
 * @returns {Promise<Buffer>}
 */
function synthesizeWithElevenLabs(text, config) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('ELEVENLABS_API_KEY not configured'));
  }

  const voiceId = config.voiceId;
  const modelId = config.modelId || 'eleven_multilingual_v2';

  const payload = JSON.stringify({
    text: text,
    model_id: modelId,
    voice_settings: config.settings || {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    }
  });

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
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          let errMsg = `ElevenLabs API error HTTP ${res.statusCode}`;
          try {
            const parsed = JSON.parse(body.toString());
            errMsg = parsed.detail?.message || parsed.message || errMsg;
          } catch (_) {}
          reject(new Error(errMsg));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ElevenLabs API request timed out after 25s'));
    });

    req.on('error', err => reject(err));
    req.write(payload);
    req.end();
  });
}

/**
 * POST /api/voice/speak
 * Synthesizes dynamic scheme text or guidance into audio using ElevenLabs.
 */
router.post('/speak', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // Rate limit check
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many voice requests. Please wait a minute before requesting audio again.'
    });
  }

  const { text, languageCode } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text_required', message: 'text field is required' });
  }

  const cleanText = cleanTextForTTS(text);

  if (cleanText.length > 900) {
    return res.status(400).json({
      error: 'text_too_long',
      message: 'Text exceeds maximum limit of 900 characters.',
      length: cleanText.length
    });
  }

  // Enforce zero PII
  try {
    assertNoPii(cleanText);
  } catch (piiErr) {
    return res.status(400).json({
      error: 'pii_detected',
      message: piiErr.message
    });
  }

  // Check language configuration
  const lang = String(languageCode || 'en').toLowerCase().trim();
  const config = getVoiceConfig(lang);

  if (config.engine === 'none') {
    return res.status(400).json({
      error: 'language_not_supported',
      message: `Voice readout is not available for language '${lang}': ${config.reason || 'Unsupported language'}.`,
      engine: 'none'
    });
  }

  // Generate SHA-256 cache key
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${lang}:${config.voiceId}:${cleanText}`)
    .digest('hex');
  const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.mp3`);

  // Check disk cache
  if (fs.existsSync(cacheFilePath)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Voice-Cache', 'HIT');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    const stream = fs.createReadStream(cacheFilePath);
    return stream.pipe(res);
  }

  // Check if API key is configured
  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(503).json({
      error: 'voice_service_unavailable',
      fallback: 'speechSynthesis',
      message: 'ElevenLabs voice engine is not active (missing backend API key). Use browser synthesis fallback.'
    });
  }

  // Character budget check
  if (sessionCharactersSynthesized + cleanText.length > MAX_SESSION_CHARACTERS) {
    return res.status(503).json({
      error: 'budget_exceeded',
      fallback: 'speechSynthesis',
      message: 'Server voice synthesis character budget reached. Falling back to device speech.'
    });
  }

  try {
    const audioBuffer = await synthesizeWithElevenLabs(cleanText, config);
    sessionCharactersSynthesized += cleanText.length;

    // Write to disk cache
    try {
      fs.writeFileSync(cacheFilePath, audioBuffer);
    } catch (writeErr) {
      console.warn('[Voice Cache] Failed writing audio cache file:', writeErr.message);
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Voice-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    return res.send(audioBuffer);
  } catch (err) {
    console.error('[Voice Error] ElevenLabs synthesis failed:', err.message);
    return res.status(502).json({
      error: 'elevenlabs_error',
      fallback: 'speechSynthesis',
      message: err.message
    });
  }
});

/**
 * GET /api/voice/status
 * Returns operational status, supported languages, and cache metrics.
 */
router.get('/status', (req, res) => {
  const supported = Object.entries(LANGUAGE_CONFIG)
    .filter(([_, cfg]) => cfg.engine === 'elevenlabs')
    .map(([code, cfg]) => ({ code, name: cfg.name, quality: cfg.quality }));

  const disabled = Object.entries(LANGUAGE_CONFIG)
    .filter(([_, cfg]) => cfg.engine === 'none')
    .map(([code, cfg]) => ({ code, name: cfg.name, reason: cfg.reason }));

  let cachedClips = 0;
  try {
    cachedClips = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.mp3')).length;
  } catch (_) {}

  res.json({
    enabled: Boolean(process.env.ELEVENLABS_API_KEY),
    provider: 'ElevenLabs (Multilingual v2)',
    supportedCount: supported.length,
    supportedLanguages: supported,
    disabledCount: disabled.length,
    disabledLanguages: disabled,
    cachedClips,
    sessionCharactersSynthesized,
    characterBudgetRemaining: Math.max(0, MAX_SESSION_CHARACTERS - sessionCharactersSynthesized)
  });
});

module.exports = router;
