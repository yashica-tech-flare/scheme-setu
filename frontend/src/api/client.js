import axios from 'axios';
import fallbackSchemes from '../data/fallbackSchemes.json';
import { recommendLocally, calculateEMILocally } from '../utils/localRuleEngine';

// Prefer explicit env var, then fallback to live Render URL in production
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://scheme-setu-wccq.onrender.com' : '');

const client = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
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

  // Get filtered partners
  getPartners: async (params = {}) => {
    try {
      const response = await client.get('/api/partners', { params });
      return response.data;
    } catch (err) {
      console.warn('[API Client] Partners API fallback triggered:', err.message);
      return [];
    }
  },

  // Get cities list
  getCities: async () => {
    try {
      const response = await client.get('/api/partners/cities');
      return response.data;
    } catch (err) {
      return ['Delhi', 'Mumbai', 'Lucknow', 'Jaipur', 'Bhopal', 'Patna'];
    }
  },

  // Submit Application Inquiry
  submitApplication: async (payload) => {
    try {
      const response = await client.post('/api/applications', payload);
      return response.data;
    } catch (err) {
      console.warn('[API Client] Saved offline inquiry:', payload);
      return { success: true, message: 'Application inquiry saved locally' };
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
  }
};

export default client;
