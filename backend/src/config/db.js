const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');
const Partner = require('../models/Partner');
const seedSchemes = require('../data/seedSchemes.json');
const seedPartners = require('../data/seedPartners.json');

async function seedInitialData() {
  try {
    const schemeCount = await Scheme.countDocuments();
    if (schemeCount === 0) {
      console.log('[DB] Seeding verified NSFDC Schemes into MongoDB Atlas...');
      await Scheme.insertMany(seedSchemes);
      console.log(`[DB] Successfully seeded ${seedSchemes.length} schemes.`);
    }

    const partnerCount = await Partner.countDocuments();
    if (partnerCount === 0) {
      console.log('[DB] Seeding verified Partners into MongoDB Atlas...');
      await Partner.insertMany(seedPartners);
      console.log(`[DB] Successfully seeded ${seedPartners.length} partners.`);
    }
  } catch (err) {
    console.error('[DB] Error during initial Atlas seed:', err.message);
  }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log('[DB] Connecting to provided MONGODB_URI (Atlas)...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('[DB] Connected to MongoDB Atlas successfully.');
      await seedInitialData();
      return mongoose.connection;
    } catch (err) {
      console.warn(`[DB] WARNING: Could not connect to external MONGODB_URI: ${err.message}.`);
      console.warn('[DB] WARNING: using in-memory fallback store.');
    }
  } else {
    console.warn('[DB] WARNING: No MONGODB_URI provided. using in-memory fallback store.');
  }

  return null;
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  seedInitialData
};
