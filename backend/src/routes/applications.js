const express = require('express');
const router = express.Router();
const { ApplicationEntity: Application } = require('../models/dbAdapter');

/**
 * POST /api/applications
 * Body: { income, projectType, projectCost, isEducation, matchedScheme, routedPartner, applicantName, phone }
 */
router.post('/', async (req, res) => {
  try {
    const {
      income,
      projectType,
      projectCost,
      isEducation,
      matchedScheme,
      routedPartner,
      applicantName,
      phone
    } = req.body;

    const referenceId = `SETU-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const application = new Application({
      referenceId,
      income: Number(income),
      projectType: projectType || 'General Business',
      projectCost: Number(projectCost),
      isEducation: Boolean(isEducation),
      matchedScheme,
      routedPartner: routedPartner || 'Pending Selection',
      applicantName: applicantName || 'SC Beneficiary Applicant',
      phone: phone || '',
      status: 'Inquiry_Sent'
    });

    const saved = await application.save();
    return res.status(201).json({
      success: true,
      message: 'Application inquiry registered successfully',
      application: saved
    });
  } catch (err) {
    console.error('Error saving application:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/applications/:refId
 */
router.get('/:refId', async (req, res) => {
  try {
    const app = await Application.findOne({ referenceId: req.params.refId });
    if (!app) {
      return res.status(404).json({ error: 'Application record not found' });
    }
    return res.status(200).json(app);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
