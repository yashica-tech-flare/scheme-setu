import axios from 'axios';
import fallbackSchemes from '../data/fallbackSchemes.json';
import { recommendLocally, calculateEMILocally, getPartnersLocally } from '../utils/localRuleEngine';

// Prefer explicit env var, then fallback to live Render URL in production
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://scheme-setu-wccq.onrender.com' : '');

const client = axios.create({
  baseURL,
  timeout: 35000, // Render free-tier cold-start can take up to 30s
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Wake up backend instance on page load to mitigate cold starts
  wakeUpBackend: () => {
    client.get('/api/health').catch(() => {});
  },

  // Recommend schemes with seamless local fallback
  getRecommendations: async (payload) => {
    try {
      const response = await client.post('/api/recommend', payload);
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return recommendLocally(payload);
    } catch (err) {
      console.warn('[API Client] Backend unreachable or slow, activating client rule engine:', err.message);
      return recommendLocally(payload);
    }
  },

  // Calculate EMI with seamless local fallback
  calculateEMI: async (payload) => {
    try {
      const response = await client.post('/api/emi', payload);
      return response.data;
    } catch (err) {
      console.warn('[API Client] EMI API fallback triggered:', err.message);
      return calculateEMILocally(payload.principal || payload.loanAmount, payload.annualRate || payload.annualInterestRate, payload.tenureMonths);
    }
  },

  // Get filtered partners with pan-India fallback
  getPartners: async (params = {}) => {
    try {
      const response = await client.get('/api/partners', { params });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return getPartnersLocally(params);
    } catch (err) {
      console.warn('[API Client] Partners API fallback triggered:', err.message);
      return getPartnersLocally(params);
    }
  },

  // Get cities list across India
  getCities: async () => {
    try {
      const response = await client.get('/api/partners/cities');
      if (Array.isArray(response.data) && response.data.length > 6) {
        return response.data;
      }
      return [
        'All India',
        'Ariyalur / Jayankondam (TN)',
        'Chennai (TN)',
        'Tiruchirappalli (TN)',
        'Madurai (TN)',
        'Coimbatore (TN)',
        'Bengaluru (KA)',
        'Hyderabad (TS)',
        'Vijayawada (AP)',
        'Kochi (KL)',
        'Thiruvananthapuram (KL)',
        'Mumbai (MH)',
        'Delhi NCR',
        'Lucknow (UP)',
        'Kolkata (WB)',
        'Ahmedabad (GJ)',
        'Jaipur (RJ)',
        'Bhopal (MP)',
        'Patna (BR)',
        'Chandigarh (PB)',
        'Bhubaneswar (OD)',
        'Guwahati (AS)'
      ];
    } catch (err) {
      return [
        'All India',
        'Ariyalur / Jayankondam (TN)',
        'Chennai (TN)',
        'Tiruchirappalli (TN)',
        'Madurai (TN)',
        'Coimbatore (TN)',
        'Bengaluru (KA)',
        'Hyderabad (TS)',
        'Vijayawada (AP)',
        'Kochi (KL)',
        'Thiruvananthapuram (KL)',
        'Mumbai (MH)',
        'Delhi NCR',
        'Lucknow (UP)',
        'Kolkata (WB)',
        'Ahmedabad (GJ)',
        'Jaipur (RJ)',
        'Bhopal (MP)',
        'Patna (BR)',
        'Chandigarh (PB)',
        'Bhubaneswar (OD)',
        'Guwahati (AS)'
      ];
    }
  },

  // Get all verified NSFDC schemes
  getSchemes: async () => {
    try {
      const response = await client.get('/api/schemes');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return fallbackSchemes;
    } catch (err) {
      return fallbackSchemes;
    }
  },

  // Get specific scheme by ID or name
  getSchemeById: async (id) => {
    try {
      const response = await client.get(`/api/schemes/${encodeURIComponent(id)}`);
      return response.data;
    } catch (err) {
      return fallbackSchemes.find(s => s._id === id || s.schemeName === id || s.name === id) || null;
    }
  },

  // Optional anonymous apply click metric
  logApplyClick: async (payload) => {
    try {
      await client.post('/api/analytics/apply-click', payload);
    } catch {
      // Fire-and-forget; never block the user
    }
  },

  // ElevenLabs multilingual voice synthesis via backend proxy
  speakText: async (text, languageCode) => {
    try {
      const response = await client.post(
        '/api/voice/speak',
        { text, languageCode },
        { responseType: 'blob', timeout: 25000 }
      );

      // Verify that response is audio
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const textData = await response.data.text();
        const json = JSON.parse(textData);
        const err = new Error(json.message || json.error || 'Voice synthesis error');
        err.code = json.code || json.error || 'voice_error';
        err.statusCode = response.status;
        throw err;
      }

      if (response.data && response.data.size > 2000) {
        return {
          blobUrl: URL.createObjectURL(response.data),
          sizeBytes: response.data.size,
          headers: response.headers || {}
        };
      }
      return null;
    } catch (err) {
      // Decode blob if server returned JSON error under responseType: 'blob'
      if (err.response?.data instanceof Blob) {
        try {
          const errText = await err.response.data.text();
          const errJson = JSON.parse(errText);
          const customErr = new Error(errJson.message || errJson.error || err.message);
          customErr.code = errJson.code || errJson.error || 'voice_error';
          customErr.statusCode = err.response.status;
          throw customErr;
        } catch (parseErr) {
          if (parseErr.code) throw parseErr;
        }
      }
      throw err;
    }
  },

  // Check voice service status and supported languages
  getVoiceStatus: async () => {
    try {
      const response = await client.get('/api/voice/status');
      return response.data;
    } catch (_) {
      return { enabled: false, fallback: 'speechSynthesis' };
    }
  }
};

export default client;
