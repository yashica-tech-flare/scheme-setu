require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function backupAndDrop() {
  const uri = process.env.MONGODB_URI;
  const backupDir = path.resolve(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(backupDir, 'applications_backup.json');

  if (!uri) {
    console.log('[Backup] No MONGODB_URI found. Checking if any local/in-memory records exist...');
    const memoryData = [];
    fs.writeFileSync(backupPath, JSON.stringify(memoryData, null, 2), 'utf-8');
    console.log(`[Backup] Backup written to ${backupPath}. Record count: 0.`);
    return;
  }

  try {
    console.log('[Backup] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('[Backup] Connected to MongoDB Atlas successfully.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const hasApps = collections.some(c => c.name === 'applications');

    if (!hasApps) {
      console.log('[Backup] No "applications" collection found in database.');
      fs.writeFileSync(backupPath, JSON.stringify([], null, 2), 'utf-8');
      console.log(`[Backup] Empty backup initialized at ${backupPath}.`);
      return;
    }

    const appsCollection = db.collection('applications');
    const records = await appsCollection.find({}).toArray();
    console.log(`[Backup] Found ${records.length} application records. Exporting to ${backupPath}...`);

    fs.writeFileSync(backupPath, JSON.stringify(records, null, 2), 'utf-8');
    console.log(`[Backup] Backup successfully written to ${backupPath} (${fs.statSync(backupPath).size} bytes).`);

    // Verify backup file exists and is readable before dropping
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file does not exist! Aborting drop.');
    }

    console.log('[Backup] Dropping "applications" collection from MongoDB Atlas...');
    await appsCollection.drop();
    console.log('[Backup] "applications" collection successfully dropped.');
  } catch (err) {
    console.error('[Backup Error]:', err.message);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Backup] Disconnected from database.');
    }
  }
}

backupAndDrop();
