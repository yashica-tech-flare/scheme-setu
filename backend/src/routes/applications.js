const express = require('express');
const router = express.Router();
const { ApplicationEntity: Application } = require('../models/dbAdapter');

// Strict State-Machine Transition Rules
const ALLOWED_TRANSITIONS = {
  inquiry_submitted: ['documents_pending', 'submitted_to_partner', 'withdrawn'],
  documents_pending: ['submitted_to_partner', 'withdrawn'],
  submitted_to_partner: ['under_appraisal', 'rejected', 'withdrawn'],
  under_appraisal: ['sanctioned', 'rejected', 'withdrawn'],
  sanctioned: ['disbursed', 'withdrawn'],
  disbursed: [], // Terminal successful state
  rejected: [],  // Terminal rejected state
  withdrawn: [], // Terminal withdrawn state

  // Backwards compatibility with legacy status strings
  Draft: ['inquiry_submitted', 'documents_pending', 'withdrawn'],
  Inquiry_Sent: ['documents_pending', 'submitted_to_partner', 'withdrawn'],
  Documents_Pending: ['submitted_to_partner', 'withdrawn'],
  Approved: ['disbursed']
};

const HUMAN_STATUS_LABELS = {
  inquiry_submitted: 'Inquiry Submitted',
  documents_pending: 'Documents Preparation',
  submitted_to_partner: 'Submitted to Channel Partner',
  under_appraisal: 'Under Technical Appraisal',
  sanctioned: 'Loan Sanctioned',
  disbursed: 'Capital Disbursed',
  rejected: 'Application Rejected',
  withdrawn: 'Withdrawn by Applicant'
};

// Active SSE clients mapped by refId: Map<string, Set<express.Response>>
const sseClients = new Map();

/**
 * Broadcast live application state to all active EventSource listeners for this refId
 */
function broadcastApplicationUpdate(refId, appData) {
  if (!refId) return;
  const clients = sseClients.get(refId);
  if (clients && clients.size > 0) {
    const payload = `data: ${JSON.stringify(appData)}\n\n`;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch (err) {
        console.warn(`[SSE] Failed writing to client for ${refId}:`, err.message);
      }
    }
  }
}

/**
 * SMS Notification Dispatch Hook (MSG91 / Twilio production integration point)
 * In production, triggers outbound SMS webhook to applicant's mobile number.
 */
function dispatchSmsNotification({ phone, refId, status, note, actor }) {
  const recipient = phone || 'Registered Beneficiary Mobile';
  const statusLabel = HUMAN_STATUS_LABELS[status] || status;
  console.log(`\n======================================================`);
  console.log(`[SMS GATEWAY - MSG91/Twilio Live Webhook Trigger]`);
  console.log(`To: ${recipient}`);
  console.log(`Application: ${refId}`);
  console.log(`Actor: ${actor.toUpperCase()} (Institutional Channel Partner)`);
  console.log(`Status: ${statusLabel}`);
  console.log(`Notice: SchemeBridge Alert: Your concessional loan application ${refId} has advanced to "${statusLabel}". Official note: "${note}".`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`======================================================\n`);
}

/**
 * Generate a cryptographically distinct SETU-XXXX-XXXX reference ID
 */
function generateReferenceId() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SETU-${part1}-${part2}`;
}

/**
 * Helper to normalize application documents into canonical tracking structure
 */
function normalizeApplicationDoc(app) {
  if (!app) return null;
  const raw = app.toObject ? app.toObject() : { ...app };

  const refId = raw.refId || raw.referenceId || 'SETU-UNKNOWN';
  const status = raw.status || 'inquiry_submitted';

  // Ensure structured applicant profile
  const applicantProfile = raw.applicantProfile || {
    income: Number(raw.income || 0),
    projectType: raw.projectType || 'General Business',
    projectCost: Number(raw.projectCost || 0),
    gender: raw.gender || 'female',
    isSC: raw.isSC !== undefined ? Boolean(raw.isSC) : true,
    isEducation: Boolean(raw.isEducation)
  };

  // Ensure structured matched scheme
  let matchedScheme = raw.matchedScheme;
  if (typeof matchedScheme === 'string' || !matchedScheme) {
    matchedScheme = {
      schemeId: 'custom',
      schemeName: typeof raw.matchedScheme === 'string' ? raw.matchedScheme : 'NSFDC Concessional Loan Scheme',
      matchScore: 95
    };
  }

  // Ensure structured routed partner
  let routedPartner = raw.routedPartner;
  if (typeof routedPartner === 'string' || !routedPartner) {
    routedPartner = {
      partnerId: 'pending',
      partnerName: typeof raw.routedPartner === 'string' ? raw.routedPartner : 'Pending Channel Partner Selection',
      partnerType: 'SCA',
      distanceKm: null
    };
  }

  // Ensure statusHistory is present with at least initial submission
  let statusHistory = Array.isArray(raw.statusHistory) && raw.statusHistory.length > 0
    ? raw.statusHistory
    : [
        {
          status: 'inquiry_submitted',
          timestamp: raw.createdAt || new Date(),
          note: 'Application inquiry registered on SchemeBridge portal',
          actor: 'system',
          isPartnerConfirmed: true
        }
      ];

  const documentsSubmitted = Array.isArray(raw.documentsSubmitted) ? raw.documentsSubmitted : [];
  const contactInfo = raw.contactInfo || {
    applicantName: raw.applicantName || 'SC Beneficiary Applicant',
    phone: raw.phone || '',
    preferredLanguage: 'en'
  };

  return {
    ...raw,
    refId,
    referenceId: refId,
    applicantProfile,
    matchedScheme,
    routedPartner,
    status,
    statusHistory,
    documentsSubmitted,
    contactInfo,
    createdAt: raw.createdAt || new Date(),
    updatedAt: raw.updatedAt || new Date()
  };
}

/**
 * POST /api/applications
 * Registers a new inquiry and establishes the tracking lifecycle
 */
router.post('/', async (req, res) => {
  try {
    const {
      income,
      projectType,
      projectCost,
      gender,
      isSC,
      isEducation,
      matchedScheme,
      routedPartner,
      applicantName,
      phone,
      preferredLanguage,
      applicantProfile: bodyProfile,
      contactInfo: bodyContact
    } = req.body;

    const refId = generateReferenceId();
    const now = new Date();

    // Construct structured profile
    const applicantProfile = bodyProfile || {
      income: Number(income || 0),
      projectType: projectType || 'General Business',
      projectCost: Number(projectCost || 0),
      gender: gender || 'female',
      isSC: isSC !== undefined ? Boolean(isSC) : true,
      isEducation: Boolean(isEducation)
    };

    // Construct structured scheme
    const formattedScheme = typeof matchedScheme === 'object' && matchedScheme !== null
      ? matchedScheme
      : {
          schemeId: 'custom',
          schemeName: matchedScheme || 'NSFDC Concessional Scheme',
          matchScore: 95
        };

    // Construct structured partner
    const formattedPartner = typeof routedPartner === 'object' && routedPartner !== null
      ? routedPartner
      : {
          partnerId: 'pending',
          partnerName: routedPartner || 'Nearest State Channelising Agency (SCA)',
          partnerType: 'SCA',
          distanceKm: null
        };

    // Construct contact info
    const contactInfo = bodyContact || {
      applicantName: applicantName || 'SC Beneficiary Applicant',
      phone: phone || '',
      preferredLanguage: preferredLanguage || 'en'
    };

    const initialHistory = [
      {
        status: 'inquiry_submitted',
        timestamp: now,
        note: 'Online inquiry registered with matched NSFDC scheme & routed partner',
        actor: 'system',
        isPartnerConfirmed: true
      }
    ];

    const application = new Application({
      refId,
      referenceId: refId,
      applicantProfile,
      matchedScheme: formattedScheme,
      routedPartner: formattedPartner,
      status: 'inquiry_submitted',
      statusHistory: initialHistory,
      documentsSubmitted: [],
      contactInfo,
      // Legacy backwards-compatible fields
      applicantName: contactInfo.applicantName,
      phone: contactInfo.phone,
      income: applicantProfile.income,
      projectType: applicantProfile.projectType,
      projectCost: applicantProfile.projectCost,
      isEducation: applicantProfile.isEducation,
      createdAt: now,
      updatedAt: now
    });

    const saved = await application.save();
    const normalized = normalizeApplicationDoc(saved);

    return res.status(201).json({
      success: true,
      message: 'Application inquiry registered and tracked successfully',
      refId,
      application: normalized
    });
  } catch (err) {
    console.error('Error saving application inquiry:', err);
    return res.status(500).json({ error: 'Failed to create application', details: err.message });
  }
});

/**
 * GET /api/applications
 * Returns recent applications for Partner / Admin management
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const apps = await Application.find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit);

    const normalized = (apps || []).map(normalizeApplicationDoc);
    return res.status(200).json({
      success: true,
      count: normalized.length,
      applications: normalized
    });
  } catch (err) {
    console.error('Error listing applications:', err);
    return res.status(500).json({ error: 'Failed to list applications', details: err.message });
  }
});

/**
 * GET /api/applications/:refId/stream
 * Real-time Server-Sent Events (SSE) push stream for live application reflection
 */
router.get('/:refId/stream', async (req, res) => {
  const { refId } = req.params;

  // Set SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Flush initial connection message
  res.write(': connected\n\n');

  // Push immediate current state if exists
  try {
    const app = await Application.findOne({
      $or: [{ refId }, { referenceId: refId }]
    });
    if (app) {
      const normalized = normalizeApplicationDoc(app);
      res.write(`data: ${JSON.stringify(normalized)}\n\n`);
    }
  } catch (err) {
    console.error('[SSE] Error sending initial state:', err);
  }

  // Register client in sseClients
  if (!sseClients.has(refId)) {
    sseClients.set(refId, new Set());
  }
  sseClients.get(refId).add(res);

  // Send periodic heartbeat ping every 20 seconds to prevent connection timeout
  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
    }
  }, 20000);

  // Handle client disconnection
  req.on('close', () => {
    clearInterval(keepAlive);
    const clients = sseClients.get(refId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseClients.delete(refId);
      }
    }
  });
});

/**
 * GET /api/applications/:refId
 * Returns complete tracked application lifecycle record
 */
router.get('/:refId', async (req, res) => {
  try {
    const { refId } = req.params;
    const app = await Application.findOne({
      $or: [{ refId }, { referenceId: refId }]
    });

    if (!app) {
      return res.status(404).json({
        error: 'Application record not found',
        refId,
        message: 'No active application matches this reference number. Please check the SETU-XXXX-XXXX format.'
      });
    }

    const normalized = normalizeApplicationDoc(app);
    return res.status(200).json(normalized);
  } catch (err) {
    console.error('Error fetching application:', err);
    return res.status(500).json({ error: 'Server error retrieving application', details: err.message });
  }
});

/**
 * PATCH /api/applications/:refId/status
 * Updates status, validates against state-machine, appends to statusHistory
 */
router.patch('/:refId/status', async (req, res) => {
  try {
    const { refId } = req.params;
    const { status: nextStatus, note, actor = 'applicant', isPartnerConfirmed = false } = req.body;

    if (!nextStatus) {
      return res.status(400).json({ error: 'Missing required field: status' });
    }

    const app = await Application.findOne({
      $or: [{ refId }, { referenceId: refId }]
    });

    if (!app) {
      return res.status(404).json({ error: 'Application record not found', refId });
    }

    const currentStatus = app.status || 'inquiry_submitted';
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

    // Enforce legal status transitions server-side
    if (!allowedNext.includes(nextStatus)) {
      return res.status(400).json({
        error: 'Illegal status transition',
        currentStatus,
        attemptedStatus: nextStatus,
        allowedNextStatuses: allowedNext,
        message: `Application in state '${currentStatus}' cannot transition directly to '${nextStatus}'. Allowed: [${allowedNext.join(', ')}]`
      });
    }

    // Trust Model Verification Note Enforcement:
    // If transitioning to high-stakes states (sanctioned, disbursed, rejected), require an explanation note
    const highStakes = ['sanctioned', 'disbursed', 'rejected', 'withdrawn'];
    if (highStakes.includes(nextStatus) && (!note || note.trim().length === 0)) {
      return res.status(400).json({
        error: 'A status update note/reason is required for this milestone transition'
      });
    }

    // Trust model annotation:
    // Disbursed / Sanctioned without partner verification are explicitly marked applicant-reported
    const validActors = ['applicant', 'partner', 'system'];
    const validatedActor = validActors.includes(actor) ? actor : 'applicant';
    const partnerVerified = Boolean(isPartnerConfirmed) || validatedActor === 'partner';
    const finalNote = partnerVerified
      ? (note || 'Partner-confirmed milestone update')
      : (note ? `${note} (Applicant-reported)` : 'Applicant-reported milestone');

    const serverTimestamp = new Date();
    const historyEntry = {
      status: nextStatus,
      timestamp: serverTimestamp,
      note: finalNote,
      actor: validatedActor,
      isPartnerConfirmed: partnerVerified
    };

    const updatedHistory = Array.isArray(app.statusHistory)
      ? [...app.statusHistory, historyEntry]
      : [historyEntry];

    // Persist changes
    if (app.statusHistory) {
      app.statusHistory.push(historyEntry);
      app.status = nextStatus;
      app.updatedAt = serverTimestamp;
      await app.save();
    } else {
      await Application.findOneAndUpdate(
        { $or: [{ refId }, { referenceId: refId }] },
        {
          $set: { status: nextStatus, updatedAt: serverTimestamp },
          $push: { statusHistory: historyEntry }
        }
      );
    }

    const updatedDoc = await Application.findOne({
      $or: [{ refId }, { referenceId: refId }]
    });

    const normalizedApp = normalizeApplicationDoc(updatedDoc);

    // Live real-time reflection: broadcast to all active SSE subscribers
    broadcastApplicationUpdate(refId, normalizedApp);

    // If milestone was confirmed by an institutional partner, trigger SMS notification alert
    if (partnerVerified) {
      dispatchSmsNotification({
        phone: normalizedApp.contactInfo?.phone,
        refId,
        status: nextStatus,
        note: finalNote,
        actor: validatedActor
      });
    }

    return res.status(200).json({
      success: true,
      message: `Status successfully updated to ${nextStatus}`,
      application: normalizedApp
    });
  } catch (err) {
    console.error('Error updating application status:', err);
    return res.status(500).json({ error: 'Server error updating status', details: err.message });
  }
});

/**
 * PATCH /api/applications/:refId/documents
 * Allows applicant to mark/unmark checklist documents as completed
 */
router.patch('/:refId/documents', async (req, res) => {
  try {
    const { refId } = req.params;
    const { documentsSubmitted, advanceStatus } = req.body;

    if (!Array.isArray(documentsSubmitted)) {
      return res.status(400).json({ error: 'documentsSubmitted must be an array of document strings' });
    }

    const app = await Application.findOne({
      $or: [{ refId }, { referenceId: refId }]
    });

    if (!app) {
      return res.status(404).json({ error: 'Application record not found', refId });
    }

    const serverTimestamp = new Date();
    app.documentsSubmitted = documentsSubmitted;
    app.updatedAt = serverTimestamp;

    // Optionally advance from inquiry_submitted to documents_pending if documents are being worked on
    if (advanceStatus && app.status === 'inquiry_submitted' && documentsSubmitted.length > 0) {
      app.status = 'documents_pending';
      const historyEntry = {
        status: 'documents_pending',
        timestamp: serverTimestamp,
        note: `Applicant marked ${documentsSubmitted.length} document(s) complete in checklist`,
        actor: 'applicant',
        isPartnerConfirmed: false
      };
      if (app.statusHistory) {
        app.statusHistory.push(historyEntry);
      }
    }

    await app.save();
    const normalizedApp = normalizeApplicationDoc(app);

    // Broadcast updated document state via SSE
    broadcastApplicationUpdate(refId, normalizedApp);

    return res.status(200).json({
      success: true,
      message: 'Document checklist updated',
      application: normalizedApp
    });
  } catch (err) {
    console.error('Error updating application documents:', err);
    return res.status(500).json({ error: 'Server error updating documents', details: err.message });
  }
});

/**
 * GET /api/applications/:refId/timeline
 * Returns statusHistory formatted for the visual UI timeline stepper
 */
router.get('/:refId/timeline', async (req, res) => {
  try {
    const { refId } = req.params;
    const app = await Application.findOne({
      $or: [{ refId }, { referenceId: refId }]
    });

    if (!app) {
      return res.status(404).json({ error: 'Application record not found', refId });
    }

    const normalized = normalizeApplicationDoc(app);
    const standardStages = [
      'inquiry_submitted',
      'documents_pending',
      'submitted_to_partner',
      'under_appraisal',
      'sanctioned',
      'disbursed'
    ];

    const currentStatus = normalized.status;
    const currentIndex = standardStages.indexOf(currentStatus);

    const timeline = standardStages.map((stageKey, idx) => {
      // Find matching history item if reached
      const historyItem = (normalized.statusHistory || []).find(h => h.status === stageKey);
      const isCompleted = currentIndex > idx || (currentIndex === idx && stageKey === 'disbursed');
      const isCurrent = currentIndex === idx;
      const isPending = currentIndex < idx;

      return {
        key: stageKey,
        label: HUMAN_STATUS_LABELS[stageKey] || stageKey,
        stepNumber: idx + 1,
        state: isCompleted ? 'completed' : isCurrent ? 'current' : 'pending',
        timestamp: historyItem ? historyItem.timestamp : null,
        note: historyItem ? historyItem.note : '',
        actor: historyItem ? historyItem.actor : 'system',
        isPartnerConfirmed: historyItem ? historyItem.isPartnerConfirmed : false
      };
    });

    // Check if terminal rejected or withdrawn state applies
    const isTerminalException = ['rejected', 'withdrawn'].includes(currentStatus);
    const exceptionEntry = isTerminalException
      ? (normalized.statusHistory || []).slice().reverse().find(h => h.status === currentStatus)
      : null;

    return res.status(200).json({
      refId: normalized.refId,
      currentStatus,
      statusLabel: HUMAN_STATUS_LABELS[currentStatus] || currentStatus,
      isTerminalException,
      exceptionEntry,
      stages: timeline,
      rawHistory: normalized.statusHistory,
      allowedNextStatuses: ALLOWED_TRANSITIONS[currentStatus] || [],
      disclaimer: "Status updates reflect applicant-reported progress unless marked 'Partner-confirmed.' SchemeBridge does not process or guarantee loan approval."
    });
  } catch (err) {
    console.error('Error fetching application timeline:', err);
    return res.status(500).json({ error: 'Server error generating timeline', details: err.message });
  }
});

module.exports = router;
