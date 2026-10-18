const { ALLOWED_DOMAINS } = require('../constants/allowedDomains');

/**
 * Validates whether an applyUrl is a safe, HTTPS government portal URL.
 * Accepts an applyUrl only if:
 * 1. It is a valid URL
 * 2. It uses https: protocol
 * 3. Its hostname ends with one of the allowed domains (.gov.in, .nic.in)
 *
 * @param {string} urlString
 * @returns {boolean}
 */
function isValidGovernmentUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString.trim());
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => hostname === domain.replace(/^\./, '') || hostname.endsWith(domain));
  } catch (err) {
    return false;
  }
}

/**
 * Extracts and sanitizes the destination domain for display.
 * @param {string} urlString
 * @returns {string|null}
 */
function getHostnameFromUrl(urlString) {
  if (!isValidGovernmentUrl(urlString)) return null;
  try {
    return new URL(urlString.trim()).hostname;
  } catch (_) {
    return null;
  }
}

/**
 * Sanitizes and secures scheme apply fields.
 * If validation fails, forces applyMode to 'offline', nulls applyUrl, and logs a warning.
 *
 * @param {Object} scheme
 * @returns {Object} Sanitized scheme
 */
function sanitizeSchemeApplyFields(scheme) {
  if (!scheme) return scheme;

  const rawApplyMode = scheme.applyMode || 'offline';
  let applyUrl = scheme.applyUrl ? String(scheme.applyUrl).trim() : null;
  let applyMode = ['online', 'offline', 'both'].includes(rawApplyMode) ? rawApplyMode : 'offline';
  const applyPortalName = scheme.applyPortalName || null;
  const applyUrlVerified = scheme.applyUrlVerified || null;
  const applyNotes = scheme.applyNotes || null;
  const rawStateLinks = Array.isArray(scheme.stateApplyLinks) ? scheme.stateApplyLinks : [];

  // Filter stateApplyLinks through validator
  const validStateApplyLinks = rawStateLinks.filter(link => {
    if (link && link.url && isValidGovernmentUrl(link.url)) {
      return true;
    }
    console.warn(`[Security Warning] Discarded invalid stateApplyLink URL '${link?.url}' for scheme '${scheme.schemeName || scheme.name}'`);
    return false;
  });

  if (applyUrl) {
    if (!isValidGovernmentUrl(applyUrl)) {
      console.warn(`[Security Warning] Untrusted or invalid applyUrl '${applyUrl}' for scheme '${scheme.schemeName || scheme.name}'. Enforcing offline mode.`);
      applyUrl = null;
      applyMode = 'offline';
    }
  } else if (applyMode === 'online') {
    // If marked online but has no verified URL, fall back to offline
    applyMode = 'offline';
  }

  return {
    ...scheme,
    applyMode,
    applyUrl,
    applyPortalName: applyUrl ? applyPortalName : null,
    applyUrlVerified: applyUrl ? applyUrlVerified : null,
    applyNotes,
    stateApplyLinks: validStateApplyLinks
  };
}

module.exports = {
  isValidGovernmentUrl,
  getHostnameFromUrl,
  sanitizeSchemeApplyFields
};
