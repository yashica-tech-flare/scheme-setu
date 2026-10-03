const express = require('express');
const router = express.Router();
const { PartnerModel: Partner } = require('../models/dbAdapter');
const { distanceKm } = require('../services/distanceUtil');

/**
 * GET /api/partners?lat=&lng=&scheme=&radiusKm=&type=&city=
 * Returns: [ { name, type, distanceKm, schemesHandled, npaStatus, fundUtilizationPercent, contact, address, location } ]
 * - Filters out partners with npaStatus = "high" or fundUtilizationPercent > 90
 * - Sorts by distance ascending if coordinates provided
 */
router.get('/', async (req, res) => {
  try {
    const { lat, lng, scheme, radiusKm, type, city } = req.query;

    // Base query: filter out high NPA or depleted fund capacity (>90%)
    const query = {
      npaStatus: { $ne: 'high' },
      fundUtilizationPercent: { $lte: 90 }
    };

    if (type) {
      query.type = type;
    }

    if (city) {
      query.city = new RegExp(`^${city}$`, 'i');
    }

    if (scheme) {
      query.schemesHandled = { $in: [scheme] };
    }

    const partners = await Partner.find(query);
    const partnerList = partners.lean ? await partners.lean() : partners;

    const hasCoords = lat !== undefined && lng !== undefined && lat !== '' && lng !== '';
    const userLat = Number(lat);
    const userLng = Number(lng);
    const maxRadius = radiusKm ? Number(radiusKm) : null;

    let processed = partnerList.map(p => {
      let dKm = null;
      if (hasCoords && p.location && p.location.lat && p.location.lng) {
        dKm = distanceKm(userLat, userLng, p.location.lat, p.location.lng);
      }
      return {
        _id: p._id,
        name: p.name,
        type: p.type,
        distanceKm: dKm,
        schemesHandled: p.schemesHandled,
        npaStatus: p.npaStatus,
        fundUtilizationPercent: p.fundUtilizationPercent,
        location: p.location,
        address: p.address,
        city: p.city,
        state: p.state,
        contact: p.contact,
        email: p.email
      };
    });

    // If max radius specified and coords provided, filter by radius
    if (hasCoords && maxRadius) {
      processed = processed.filter(p => p.distanceKm !== null && p.distanceKm <= maxRadius);
    }

    // Sort by distance ascending if coordinates provided
    if (hasCoords) {
      processed.sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return res.status(200).json(processed);
  } catch (err) {
    console.error('Error in /api/partners:', err);
    return res.status(500).json({
      error: 'Internal server error fetching partners',
      details: err.message
    });
  }
});

/**
 * GET /api/partners/cities
 * Returns list of unique cities represented in the partner network
 */
router.get('/cities', async (req, res) => {
  try {
    const cities = await Partner.distinct('city', {
      npaStatus: { $ne: 'high' },
      fundUtilizationPercent: { $lte: 90 }
    });
    return res.status(200).json(cities.filter(Boolean));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
