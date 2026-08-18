const { createHmac, timingSafeEqual } = require('crypto')

/**
 * Parses an X-Puurk-Signature header of the form 't=<unix_seconds>,v1=<hex>'.
 * @param {string} header Raw header value.
 * @return {{t: number, v1: string}|null} Parsed parts, or null when malformed.
 */
function parseSignatureHeader (header) {
  if (typeof header !== 'string' || header.length === 0) return null
  const parts = header.split(',').map(p => p.trim())
  let t = null
  let v1 = null
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const key = part.slice(0, eq)
    const value = part.slice(eq + 1)
    if (key === 't') t = Number(value)
    else if (key === 'v1') v1 = value
  }
  if (!Number.isFinite(t) || !v1) return null
  return { t, v1 }
}

/**
 * Computes the HMAC-SHA256 signature Puurk uses for webhook deliveries:
 * hex(HMAC-SHA256(secret, '<timestamp>.<raw_body_bytes>')).
 * @param {string} secret Webhook endpoint signing secret.
 * @param {number} timestamp Unix seconds at signing time.
 * @param {Buffer} rawBody Exact request body bytes.
 * @return {string} Lowercase hex digest.
 */
function computeSignature (secret, timestamp, rawBody) {
  const signedContent = Buffer.concat([
    Buffer.from(`${timestamp}.`, 'utf8'),
    rawBody
  ])
  return createHmac('sha256', secret).update(signedContent).digest('hex')
}

/**
 * Verifies a webhook delivery signature with optional timestamp drift check.
 * @param {{secret: string, timestamp: number, rawBody: Buffer, expectedHex: string, toleranceSeconds: number}} params
 *   Endpoint secret, parsed header timestamp, exact body bytes, header v1
 *   value, and allowed clock drift in seconds (0 disables).
 * @return {{ok: boolean, reason?: string}} Verification result.
 */
function verifyWebhookSignature ({ secret, timestamp, rawBody, expectedHex, toleranceSeconds }) {
  if (!secret) return { ok: false, reason: 'WEBHOOK_SECRET not configured' }
  if (!Buffer.isBuffer(rawBody)) return { ok: false, reason: 'raw body unavailable' }

  if (toleranceSeconds > 0) {
    const drift = Math.abs(Math.floor(Date.now() / 1000) - timestamp)
    if (drift > toleranceSeconds) {
      return { ok: false, reason: `timestamp drift ${drift}s exceeds tolerance ${toleranceSeconds}s` }
    }
  }

  const computedHex = computeSignature(secret, timestamp, rawBody)
  if (computedHex.length !== expectedHex.length) {
    return { ok: false, reason: 'signature length mismatch' }
  }
  const a = Buffer.from(computedHex, 'utf8')
  const b = Buffer.from(expectedHex, 'utf8')
  if (!timingSafeEqual(a, b)) return { ok: false, reason: 'signature mismatch' }

  return { ok: true }
}

module.exports = { parseSignatureHeader, computeSignature, verifyWebhookSignature }
