/**
 * Allow-listed domains for official government application redirects.
 * Only HTTPS URLs whose hostnames end with these suffixes are permitted.
 */
const ALLOWED_DOMAINS = [
  '.gov.in',
  '.nic.in'
];

module.exports = {
  ALLOWED_DOMAINS
};
