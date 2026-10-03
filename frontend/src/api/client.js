import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Recommend schemes
  getRecommendations: async (payload) => {
    const response = await client.post('/api/recommend', payload);
    return response.data;
  },

  // Calculate EMI
  calculateEMI: async (payload) => {
    const response = await client.post('/api/emi', payload);
    return response.data;
  },

  // Get filtered partners
  getPartners: async (params = {}) => {
    const response = await client.get('/api/partners', { params });
    return response.data;
  },

  // Get cities list
  getCities: async () => {
    const response = await client.get('/api/partners/cities');
    return response.data;
  },

  // Submit Application Inquiry
  submitApplication: async (payload) => {
    const response = await client.post('/api/applications', payload);
    return response.data;
  },

  // Get all verified NSFDC schemes
  getSchemes: async () => {
    const response = await client.get('/api/schemes');
    return response.data;
  },

  // Get specific scheme by ID or name
  getSchemeById: async (id) => {
    const response = await client.get(`/api/schemes/${encodeURIComponent(id)}`);
    return response.data;
  }
};

export default client;
