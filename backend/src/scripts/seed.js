require('dotenv').config();
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');
const Partner = require('../models/Partner');
const seedSchemes = require('../data/seedSchemes.json');
const seedPartners = require('../data/seedPartners.json');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scheme_setu';
  console.log('Connecting to MongoDB for seeding:', uri);

  try {
    await mongoose.connect(uri);
    console.log('Clearing existing Schemes and Partners...');
    await Scheme.deleteMany({});
    await Partner.deleteMany({});

    console.log(`Inserting ${seedSchemes.length} schemes...`);
    await Scheme.insertMany(seedSchemes);

    console.log(`Inserting ${seedPartners.length} partners...`);
    await Partner.insertMany(seedPartners);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
