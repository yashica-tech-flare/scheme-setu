const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Schema for anonymous usage metrics (strictly NO personal data, NO IP, NO cookies)
const applyRedirectSchema = new mongoose.Schema({
  schemeId: { type: String, required: true },
  languageCode: { type: String, default: 'en' },
  timestamp: { type: Date, default: Date.now }
});

let ApplyRedirectLog = null;
try {
  ApplyRedirectLog = mongoose.model('ApplyRedirectLog', applyRedirectSchema);
} catch (_) {
  ApplyRedirectLog = mongoose.models.ApplyRedirectLog;
}

// In-memory fallback array for local/offline execution
const memoryRedirectLogs = [];

/**
 * POST /api/analytics/apply-redirect & POST /api/analytics/apply-click
 * Body: { schemeId, languageCode }
 * Strictly anonymous metric logging when a user confirms redirect to official portal.
 */
const handleApplyLog = async (req, res) => {
  try {
    const { schemeId, languageCode } = req.body;
    if (!schemeId) {
      return res.status(400).json({ error: 'schemeId is required' });
    }

    const entry = {
      schemeId: String(schemeId).slice(0, 100),
      languageCode: String(languageCode || 'en').slice(0, 10),
      timestamp: new Date()
    };

    if (mongoose.connection.readyState === 1 && ApplyRedirectLog) {
      await ApplyRedirectLog.create(entry);
    } else {
      memoryRedirectLogs.push(entry);
      // Keep memory store bounded
      if (memoryRedirectLogs.length > 500) memoryRedirectLogs.shift();
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error logging apply redirect:', err.message);
    return res.status(200).json({ success: false }); // Non-blocking
  }
};

router.post('/apply-redirect', handleApplyLog);
router.post('/apply-click', handleApplyLog);

module.exports = router;
