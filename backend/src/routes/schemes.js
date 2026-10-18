const express = require('express');
const router = express.Router();
const { SchemeModel: Scheme } = require('../models/dbAdapter');
const { sanitizeSchemeApplyFields } = require('../utils/urlValidator');

/**
 * GET /api/schemes
 * Returns full records of all NSFDC verified schemes
 */
router.get('/', async (req, res) => {
  try {
    const rawSchemes = await Scheme.find({});
    const schemesList = Array.isArray(rawSchemes) ? rawSchemes : (rawSchemes.lean ? await rawSchemes.lean() : []);
    const sanitized = schemesList.map(s => {
      const plain = typeof s.toObject === 'function' ? s.toObject() : { ...s };
      return sanitizeSchemeApplyFields(plain);
    });
    return res.status(200).json(sanitized);
  } catch (err) {
    console.error('Error fetching schemes:', err);
    return res.status(500).json({ error: 'Failed to fetch schemes', details: err.message });
  }
});

/**
 * GET /api/schemes/:id
 * Returns single scheme by _id or schemeName
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let scheme = null;

    if (Scheme.findById) {
      scheme = await Scheme.findById(id);
    }

    if (!scheme && Scheme.findOne) {
      scheme = await Scheme.findOne({
        $or: [
          { _id: id },
          { schemeName: id },
          { name: id }
        ]
      });
    }

    if (!scheme) {
      // Try searching inside all schemes
      const all = await Scheme.find({});
      const list = Array.isArray(all) ? all : (all.lean ? await all.lean() : []);
      scheme = list.find(s => s._id === id || s.schemeName === id || s.name === id || s.nameHi === id) || null;
    }

    if (!scheme) {
      return res.status(404).json({ error: `Scheme '${id}' not found` });
    }

    const plain = typeof scheme.toObject === 'function' ? scheme.toObject() : { ...scheme };
    return res.status(200).json(sanitizeSchemeApplyFields(plain));
  } catch (err) {
    console.error('Error fetching scheme by id:', err);
    return res.status(500).json({ error: 'Failed to fetch scheme record', details: err.message });
  }
});

module.exports = router;
