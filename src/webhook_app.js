const express = require('express')
const { parseSignatureHeader, verifyWebhookSignature } = require('./verify_signature')

/**
 * Builds the webhook receiver app without starting a listener: verifies
 * X-Puurk-Signature on each delivery, dedupes on event id, and logs the event.
 * @param {{webhookPath: string, webhookSecret: string, signatureToleranceSeconds: number}} options
 *   Path the signed POST receiver is mounted on, endpoint signing secret, and
 *   allowed clock drift in seconds (0 disables the check).
 * @return {import('express').Express} The configured Express app.
 */
function createWebhookApp ({ webhookPath, webhookSecret, signatureToleranceSeconds }) {
  const app = express()

  // Events are delivered at most once per retry attempt but the same event id
  // is shared across all of a partner's endpoints, so dedupe on (event id).
  const seenEventIds = new Set()

  app.get('/health', (req, res) => res.json({ ok: true }))

  app.post(webhookPath, express.raw({ type: 'application/json', limit: '1mb' }), (req, res) => {
    const header = req.get('X-Puurk-Signature')
    const parsed = parseSignatureHeader(header)
    if (!parsed) {
      console.warn('Rejected delivery: missing or malformed X-Puurk-Signature header')
      return res.status(401).json({ error: 'missing or malformed signature header' })
    }

    const result = verifyWebhookSignature({
      secret: webhookSecret,
      timestamp: parsed.t,
      rawBody: req.body,
      expectedHex: parsed.v1,
      toleranceSeconds: signatureToleranceSeconds
    })
    if (!result.ok) {
      console.warn(`Rejected delivery: ${result.reason}`)
      return res.status(401).json({ error: result.reason })
    }

    let event
    try {
      event = JSON.parse(req.body.toString('utf8'))
    } catch {
      return res.status(400).json({ error: 'invalid JSON body' })
    }

    if (event.id && seenEventIds.has(event.id)) {
      console.log(`Duplicate delivery for event ${event.id} — acknowledged, not reprocessed`)
      return res.json({ received: true, duplicate: true })
    }
    if (event.id) seenEventIds.add(event.id)

    console.log(`[${new Date().toISOString()}] ${event.type} (${event.id})`)
    console.log(JSON.stringify(event.data, null, 2))

    // A real integration would enqueue the event here and process it
    // asynchronously; always acknowledge quickly (Puurk times out at 10s).
    res.json({ received: true })
  })

  return app
}

module.exports = { createWebhookApp }
