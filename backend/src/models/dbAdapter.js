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
    this.createdAt = this.createdAt || new Date();
  }
  async save() {
    if (mongoose.connection.readyState === 1) {
      const MongooseApp = mongoose.models.Application || require('./Application');
      const doc = new MongooseApp(this);
      return doc.save();
    }
    memoryStore.applications.push(this);
    return this;
  }
  static async findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      const MongooseApp = mongoose.models.Application || require('./Application');
      return MongooseApp.findOne(filter);
    }
    return memoryStore.applications.find(a => matchFilter(a, filter)) || null;
  }
}

module.exports = {
  SchemeModel,
  PartnerModel,
  ApplicationEntity,
  memoryStore
};
