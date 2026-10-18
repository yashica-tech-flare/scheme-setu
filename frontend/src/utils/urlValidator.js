/**
 * Frontend Government URL allow-list validator.
 * Defense-in-depth security to ensure external redirects only go to authorized .gov.in and .nic.in portals.
 */
export const ALLOWED_GOV_DOMAINS = [
  '.gov.in',
  '.nic.in'
];

/**
 * Validates that an applyUrl is HTTPS and ends with an allow-listed government domain.
 * @param {string} urlString
 * @returns {boolean}
 */
export function isValidGovernmentUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString.trim());
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_GOV_DOMAINS.some(domain => hostname === domain.replace(/^\./, '') || hostname.endsWith(domain));
  } catch (err) {
    return false;
  }
}

/**
 * Extracts hostname safely.
 * @param {string} urlString
 * @returns {string}
 */
export function getDomainDisplay(urlString) {
  try {
    return new URL(urlString).hostname;
  } catch (_) {
    return urlString || '';
  }
}
