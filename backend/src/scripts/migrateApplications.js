require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('../models/Application');

async function migrateApplications() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[Migration] No MONGODB_URI detected in environment. Skipping Atlas remote migration.');
    return;
  }

  try {
    console.log('[Migration] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('[Migration] Connected to MongoDB Atlas.');

    const apps = await Application.find({});
    console.log(`[Migration] Found ${apps.length} applications to inspect.`);

    let updatedCount = 0;
    for (const app of apps) {
      let changed = false;

      // 1. Ensure refId is set
      if (!app.refId && app.referenceId) {
        app.refId = app.referenceId;
        changed = true;
      } else if (!app.refId) {
        app.refId = `SETU-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        changed = true;
      }

      // 2. Normalize status
      const legacyMap = {
        'Draft': 'inquiry_submitted',
        'Inquiry_Sent': 'inquiry_submitted',
        'Documents_Pending': 'documents_pending',
        'Approved': 'sanctioned'
      };

      if (!app.status || legacyMap[app.status]) {
        app.status = legacyMap[app.status] || 'inquiry_submitted';
        changed = true;
      }

      // 3. Ensure statusHistory array exists
      if (!Array.isArray(app.statusHistory) || app.statusHistory.length === 0) {
        app.statusHistory = [
          {
            status: 'inquiry_submitted',
            timestamp: app.createdAt || new Date(),
            note: 'Initial inquiry registered on Scheme Setu portal',
            actor: 'system',
            isPartnerConfirmed: true
          }
        ];
        changed = true;
      }

      // 4. Ensure documentsSubmitted array
      if (!Array.isArray(app.documentsSubmitted)) {
        app.documentsSubmitted = [];
        changed = true;
      }

      // 5. Ensure structured profile & scheme
      if (!app.applicantProfile) {
        app.applicantProfile = {
          income: Number(app.income || 250000),
          projectType: app.projectType || 'General Business',
          projectCost: Number(app.projectCost || 140000),
          gender: 'female',
          isSC: true,
          isEducation: Boolean(app.isEducation)
        };
        changed = true;
      }

      if (!app.matchedScheme || typeof app.matchedScheme === 'string') {
        const rawName = typeof app.matchedScheme === 'string' ? app.matchedScheme : 'Mahila Samriddhi Yojana (MSY)';
        app.matchedScheme = {
          schemeId: 'custom',
          schemeName: rawName,
          matchScore: 95
        };
        changed = true;
      }

      if (changed) {
        app.updatedAt = new Date();
        await app.save();
        updatedCount++;
      }
    }

    console.log(`[Migration] Completed successfully. Migrated ${updatedCount} of ${apps.length} records.`);
  } catch (err) {
    console.error('[Migration Error]:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[Migration] Disconnected from database.');
  }
}

if (require.main === module) {
  migrateApplications();
}

module.exports = migrateApplications;
