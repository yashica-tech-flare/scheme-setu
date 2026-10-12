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

  // Submit Application Inquiry
  submitApplication: async (payload) => {
    try {
      const response = await client.post('/api/applications', payload);
      if (response.data?.application) {
        saveLocalApplication(response.data.application);
      }
      return response.data;
    } catch (err) {
      console.warn('[API Client] Saved offline inquiry:', payload);
      // Offline fallback generator
      const refId = `SETU-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackApp = {
        refId,
        referenceId: refId,
        applicantProfile: {
          income: Number(payload.income || 250000),
          projectType: payload.projectType || 'General Business',
          projectCost: Number(payload.projectCost || 140000),
          gender: payload.gender || 'female',
          isSC: true,
          isEducation: Boolean(payload.isEducation)
        },
        matchedScheme: typeof payload.matchedScheme === 'object' ? payload.matchedScheme : {
          schemeName: payload.matchedScheme || 'Mahila Samriddhi Yojana (MSY)',
          matchScore: 95
        },
        routedPartner: typeof payload.routedPartner === 'object' ? payload.routedPartner : {
          partnerName: payload.routedPartner || 'TAHDCO District Office, Ariyalur',
          partnerType: 'SCA'
        },
        status: 'inquiry_submitted',
        statusHistory: [
          {
            status: 'inquiry_submitted',
            timestamp: new Date().toISOString(),
            note: 'Application inquiry registered (Saved locally)',
            actor: 'system',
            isPartnerConfirmed: true
          }
        ],
        documentsSubmitted: [],
        contactInfo: {
          applicantName: payload.applicantName || 'SC Beneficiary Applicant',
          phone: payload.phone || '',
          preferredLanguage: 'en'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveLocalApplication(fallbackApp);
      return { success: true, refId, application: fallbackApp, isOffline: true };
    }
  },

  // Lookup tracked application by refId
  getApplication: async (refId) => {
    const cleanRef = (refId || '').trim().toUpperCase();
    try {
      const response = await client.get(`/api/applications/${encodeURIComponent(cleanRef)}`);
      if (response.data) {
        saveLocalApplication(response.data);
        return response.data;
      }
    } catch (err) {
      console.warn('[API Client] Backend lookup failed, checking local store:', err.message);
    }

    // Check local store
    const local = getLocalApplication(cleanRef);
    if (local) return local;

    // Default demo application for instant testability
    if (cleanRef === 'SETU-DEMO-2026' || cleanRef === 'DEMO') {
      return getDemoApplication();
    }

    return null;
  },

  // Update application status with state-machine audit note
  updateApplicationStatus: async (refId, { status, note, actor, isPartnerConfirmed }) => {
    const cleanRef = (refId || '').trim().toUpperCase();
    try {
      const response = await client.patch(`/api/applications/${encodeURIComponent(cleanRef)}/status`, {
        status,
        note,
        actor,
        isPartnerConfirmed
      });
      if (response.data?.application) {
        saveLocalApplication(response.data.application);
      }
      return response.data;
    } catch (err) {
      console.warn('[API Client] Remote status update failed, updating local store:', err.message);
      const app = getLocalApplication(cleanRef) || (cleanRef === 'SETU-DEMO-2026' ? getDemoApplication() : null);
      if (app) {
        app.status = status;
        app.updatedAt = new Date().toISOString();
        const historyItem = {
          status,
          timestamp: new Date().toISOString(),
          note: note || (isPartnerConfirmed ? 'Partner-confirmed milestone' : 'Applicant-reported milestone'),
          actor: actor || 'applicant',
          isPartnerConfirmed: Boolean(isPartnerConfirmed)
        };
        app.statusHistory = app.statusHistory || [];
        app.statusHistory.push(historyItem);
        saveLocalApplication(app);
        return { success: true, application: app, isOffline: true };
      }
      throw err;
    }
  },

  // Mark/unmark documents in checklist
  updateApplicationDocuments: async (refId, { documentsSubmitted, advanceStatus }) => {
    const cleanRef = (refId || '').trim().toUpperCase();
    try {
      const response = await client.patch(`/api/applications/${encodeURIComponent(cleanRef)}/documents`, {
        documentsSubmitted,
        advanceStatus
      });
      if (response.data?.application) {
        saveLocalApplication(response.data.application);
      }
      return response.data;
    } catch (err) {
      console.warn('[API Client] Remote documents update failed, saving local:', err.message);
      const app = getLocalApplication(cleanRef) || (cleanRef === 'SETU-DEMO-2026' ? getDemoApplication() : null);
      if (app) {
        app.documentsSubmitted = documentsSubmitted;
        app.updatedAt = new Date().toISOString();
        if (advanceStatus && app.status === 'inquiry_submitted' && documentsSubmitted.length > 0) {
          app.status = 'documents_pending';
          app.statusHistory.push({
            status: 'documents_pending',
            timestamp: new Date().toISOString(),
            note: `Applicant marked ${documentsSubmitted.length} documents completed`,
            actor: 'applicant',
            isPartnerConfirmed: false
          });
        }
        saveLocalApplication(app);
        return { success: true, application: app, isOffline: true };
      }
      throw err;
    }
  },

  // Get formatted timeline
  getApplicationTimeline: async (refId) => {
    const cleanRef = (refId || '').trim().toUpperCase();
    try {
      const response = await client.get(`/api/applications/${encodeURIComponent(cleanRef)}/timeline`);
      return response.data;
    } catch (err) {
      console.warn('[API Client] Remote timeline failed, computing local timeline:', err.message);
      const app = await api.getApplication(cleanRef);
      if (!app) return null;

      const standardStages = [
        'inquiry_submitted',
        'documents_pending',
        'submitted_to_partner',
        'under_appraisal',
        'sanctioned',
        'disbursed'
      ];
      const currentIndex = standardStages.indexOf(app.status);
      const stages = standardStages.map((stageKey, idx) => {
        const historyItem = (app.statusHistory || []).find(h => h.status === stageKey);
        return {
          key: stageKey,
          label: stageKey.replace(/_/g, ' ').toUpperCase(),
          stepNumber: idx + 1,
          state: currentIndex > idx ? 'completed' : currentIndex === idx ? 'current' : 'pending',
          timestamp: historyItem ? historyItem.timestamp : null,
          note: historyItem ? historyItem.note : '',
          actor: historyItem ? historyItem.actor : 'system',
          isPartnerConfirmed: historyItem ? historyItem.isPartnerConfirmed : false
        };
      });

      return {
        refId: app.refId,
        currentStatus: app.status,
        statusLabel: app.status.replace(/_/g, ' ').toUpperCase(),
        stages,
        rawHistory: app.statusHistory,
        disclaimer: "Status updates reflect applicant-reported progress unless marked 'Partner-confirmed.' Scheme Setu does not process or guarantee loan approval."
      };
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

// Local storage helper functions
function saveLocalApplication(app) {
  try {
    const list = JSON.parse(localStorage.getItem('scheme_setu_apps') || '[]');
    const index = list.findIndex(a => a.refId === app.refId || a.referenceId === app.refId);
    if (index >= 0) {
      list[index] = app;
    } else {
      list.unshift(app);
    }
    localStorage.setItem('scheme_setu_apps', JSON.stringify(list.slice(0, 20)));
    localStorage.setItem('scheme_setu_last_ref', app.refId);
  } catch (e) {
    // ignore localstorage errors
  }
}

function getLocalApplication(refId) {
  try {
    const list = JSON.parse(localStorage.getItem('scheme_setu_apps') || '[]');
    return list.find(a => a.refId === refId || a.referenceId === refId) || null;
  } catch (e) {
    return null;
  }
}

function getDemoApplication() {
  return {
    refId: "SETU-DEMO-2026",
    referenceId: "SETU-DEMO-2026",
    applicantProfile: {
      income: 180000,
      projectType: "small_business",
      projectCost: 140000,
      gender: "female",
      isSC: true,
      isEducation: false
    },
    matchedScheme: {
      schemeId: "scheme_1",
      schemeName: "Mahila Samriddhi Yojana (MSY)",
      matchScore: 98,
      interestRate: 4,
      maxLoanAmount: 140000,
      moratoriumMonths: 6
    },
    routedPartner: {
      partnerId: "partner_1",
      partnerName: "TAHDCO District Office, Ariyalur",
      partnerType: "SCA",
      distanceKm: 4.2,
      contact: "04329-228300",
      address: "District Collectorate Complex, Jayankondam Road, Ariyalur - 621704"
    },
    status: "documents_pending",
    statusHistory: [
      {
        status: "inquiry_submitted",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        note: "Online inquiry registered via Scheme Setu portal",
        actor: "system",
        isPartnerConfirmed: true
      },
      {
        status: "documents_pending",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        note: "Applicant assembling required documents per checklist",
        actor: "applicant",
        isPartnerConfirmed: false
      }
    ],
    documentsSubmitted: [
      "Caste Certificate (Verified SC status)",
      "Income Certificate (≤ ₹5,00,000/yr)"
    ],
    contactInfo: {
      applicantName: "Selvi Priya",
      phone: "9876543210",
      preferredLanguage: "ta"
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  };
}

export default client;
