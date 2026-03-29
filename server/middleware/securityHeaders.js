/**
 * server/middleware/securityHeaders.js
 *
 * Adds security hardening headers to all responses:
 *   - X-Content-Type-Options: nosniff
 *   - X-Frame-Options: DENY
 *   - Strict-Transport-Security (HSTS) — only in production
 *   - X-XSS-Protection: 1; mode=block
 *   - Referrer-Policy: strict-origin-when-cross-origin
 *
 * Cache-Control headers are set per-route (see cacheControl.js).
 */

'use strict';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (IS_PROD) {
    // HSTS: 1 year, include subdomains
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  next();
}

module.exports = { securityHeaders };
