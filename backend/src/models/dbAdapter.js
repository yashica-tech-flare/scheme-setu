const mongoose = require('mongoose');
const seedSchemes = require('../data/seedSchemes.json');
const seedPartners = require('../data/seedPartners.json');

// Memory store for standalone/offline fallback
const memoryStore = {
  schemes: seedSchemes.map((s, idx) => ({ _id: `scheme_${idx + 1}`, ...s })),
  partners: seedPartners.map((p, idx) => ({ _id: `partner_${idx + 1}`, ...p })),
  applications: []
};

function matchFilter(doc, filter = {}) {
  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(val)) {
      const anyMatch = val.some(subFilter => matchFilter(doc, subFilter));
      if (!anyMatch) return false;
      continue;
    }
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof RegExp)) {
      if (val.$ne !== undefined && doc[key] === val.$ne) return false;
      if (val.$lte !== undefined && !(Number(doc[key]) <= Number(val.$lte))) return false;
      if (val.$gte !== undefined && !(Number(doc[key]) >= Number(val.$gte))) return false;
      if (val.$in !== undefined && Array.isArray(val.$in)) {
        if (Array.isArray(doc[key])) {
          const match = val.$in.some(item => doc[key].includes(item));
          if (!match) return false;
        } else if (!val.$in.includes(doc[key])) {
          return false;
        }
      }
    } else if (val instanceof RegExp) {
      if (!val.test(String(doc[key] || ''))) return false;
    } else if (val !== undefined) {
      if (Array.isArray(doc[key])) {
        if (!doc[key].includes(val)) return false;
      } else if (doc[key] !== val) {
        return false;
      }
    }
  }
  return true;
}

const SchemeModel = {
  async find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      const MongooseScheme = mongoose.models.Scheme || require('./Scheme');
      return MongooseScheme.find(filter);
    }
    const matched = memoryStore.schemes.filter(s => matchFilter(s, filter));
    return {
      lean: async () => matched,
      then: (resolve) => resolve(matched)
    };
  },
  async findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      const MongooseScheme = mongoose.models.Scheme || require('./Scheme');
      return MongooseScheme.findOne(filter);
    }
    const found = memoryStore.schemes.find(s => matchFilter(s, filter)) || null;
    return {
      lean: async () => found,
      then: (resolve) => resolve(found)
    };
  },
  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      const MongooseScheme = mongoose.models.Scheme || require('./Scheme');
      return MongooseScheme.findById(id);
    }
    const found = memoryStore.schemes.find(s => s._id === id || s.schemeName === id || s.name === id) || null;
    return {
      lean: async () => found,
      then: (resolve) => resolve(found)
    };
  },
  async countDocuments() {
    if (mongoose.connection.readyState === 1) {
      const MongooseScheme = mongoose.models.Scheme || require('./Scheme');
      return MongooseScheme.countDocuments();
    }
    return memoryStore.schemes.length;
  }
};

const PartnerModel = {
  find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      const MongoosePartner = mongoose.models.Partner || require('./Partner');
      return MongoosePartner.find(filter);
    }
    const matched = memoryStore.partners.filter(p => matchFilter(p, filter));
    return {
      lean: async () => matched,
      then: (resolve) => resolve(matched)
    };
  },
  async distinct(field, filter = {}) {
    if (mongoose.connection.readyState === 1) {
      const MongoosePartner = mongoose.models.Partner || require('./Partner');
      return MongoosePartner.distinct(field, filter);
    }
    const matched = memoryStore.partners.filter(p => matchFilter(p, filter));
    const values = [...new Set(matched.map(p => p[field]).filter(Boolean))];
    return values;
  },
  async countDocuments() {
    if (mongoose.connection.readyState === 1) {
      const MongoosePartner = mongoose.models.Partner || require('./Partner');
      return MongoosePartner.countDocuments();
    }
    return memoryStore.partners.length;
  }
};

class ApplicationEntity {
  constructor(data) {
    Object.assign(this, data);
    this.refId = this.refId || this.referenceId;
    this.referenceId = this.referenceId || this.refId;
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
    this.status = this.status || 'inquiry_submitted';
    this.statusHistory = this.statusHistory || [];
    this.documentsSubmitted = this.documentsSubmitted || [];
  }

  async save() {
    this.updatedAt = new Date();
    this.refId = this.refId || this.referenceId;
    this.referenceId = this.referenceId || this.refId;
    if (mongoose.connection.readyState === 1) {
      const MongooseApp = mongoose.models.Application || require('./Application');
      const doc = new MongooseApp(this);
      return doc.save();
    }
    const existingIndex = memoryStore.applications.findIndex(
      a => (a.refId && a.refId === this.refId) || (a.referenceId && a.referenceId === this.referenceId)
    );
    if (existingIndex >= 0) {
      memoryStore.applications[existingIndex] = this;
    } else {
      memoryStore.applications.push(this);
    }
    return this;
  }

  static async findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      const MongooseApp = mongoose.models.Application || require('./Application');
      return MongooseApp.findOne(filter);
    }
    const found = memoryStore.applications.find(a => {
      if (filter.refId && (a.refId === filter.refId || a.referenceId === filter.refId)) return true;
      if (filter.referenceId && (a.referenceId === filter.referenceId || a.refId === filter.referenceId)) return true;
      return matchFilter(a, filter);
    }) || null;
    return found;
  }

  static async find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      const MongooseApp = mongoose.models.Application || require('./Application');
      return MongooseApp.find(filter);
    }
    const matched = memoryStore.applications.filter(a => matchFilter(a, filter));
    return matched;
  }

  static async findOneAndUpdate(filter = {}, update = {}, options = {}) {
    if (mongoose.connection.readyState === 1) {
      const MongooseApp = mongoose.models.Application || require('./Application');
      return MongooseApp.findOneAndUpdate(filter, update, { new: true, ...options });
    }
    const app = await ApplicationEntity.findOne(filter);
    if (!app) return null;
    if (update.$set) {
      Object.assign(app, update.$set);
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        if (!Array.isArray(app[k])) app[k] = [];
        app[k].push(v);
      }
    }
    for (const [k, v] of Object.entries(update)) {
      if (!k.startsWith('$')) {
        app[k] = v;
      }
    }
    app.updatedAt = new Date();
    return app;
  }
}

// Seed demo application in memoryStore for instant verification & testing
const sampleDemoApp = {
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
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      note: "Online inquiry registered via Scheme Setu portal",
      actor: "system",
      isPartnerConfirmed: true
    },
    {
      status: "documents_pending",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
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
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
};

memoryStore.applications = [sampleDemoApp];

module.exports = {
  SchemeModel,
  PartnerModel,
  ApplicationEntity,
  memoryStore
};

