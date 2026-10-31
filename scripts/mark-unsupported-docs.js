const fs = require('fs');
const path = require('path');

const seedPath = path.resolve(__dirname, '../backend/src/data/seedSchemes.json');
const fallbackPath = path.resolve(__dirname, '../frontend/src/data/fallbackSchemes.json');

const UNVERIFIED_DOC_IDS = new Set([
  'doc_shg_photo',
  'doc_business_note',
  'doc_trade_license',
  'doc_udyam',
  'doc_land_lease',
  'doc_coborrower',
  'doc_green_invoice',
  'doc_transport_permit',
  'doc_solar_site',
  'doc_voctech_toolkit'
]);

function updateDataset(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let markedCount = 0;

  data.forEach(scheme => {
    if (Array.isArray(scheme.requiredDocuments)) {
      scheme.requiredDocuments.forEach(doc => {
        if (UNVERIFIED_DOC_IDS.has(doc.id)) {
          doc.verificationStatus = '// TODO verify';
          markedCount++;
        }
      });
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${filePath}: marked ${markedCount} doc occurrences with '// TODO verify'.`);
}

updateDataset(seedPath);
updateDataset(fallbackPath);

