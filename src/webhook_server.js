/**
 * Webhook receiver: verifies X-Puurk-Signature on each delivery, dedupes on
 * event id, and logs the event. Run behind an HTTPS tunnel (e.g. ngrok) and
 * register the public URL with `npm run register-webhook`.
 */

const express = require('express')
const { config } = require('./config')
const { parseSignatureHeader, verifyWebhookSignature } = require('./verify_signature')

const app = express()

// Events are delivered at most once per retry attempt but the same event id
// is shared across all of a partner's endpoints, so dedupe on (event id).
const seenEventIds = new Set()

app.get('/health', (req, res) => res.json({ ok: true }))

app.post(config.webhookPath, express.raw({ type: 'application/json', limit: '1mb' }), (req, res) => {
  const header = req.get('X-Puurk-Signature')
  const parsed = parseSignatureHeader(header)
  if (!parsed) {
    console.warn('Rejected delivery: missing or malformed X-Puurk-Signature header')
    return res.status(401).json({ error: 'missing or malformed signature header' })
  }

  const result = verifyWebhookSignature({
    secret: config.webhookSecret,
    timestamp: parsed.t,
    rawBody: req.body,
    expectedHex: parsed.v1,
    toleranceSeconds: config.signatureToleranceSeconds
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

app.listen(config.webhookPort, () => {
  console.log(`Webhook receiver listening on http://localhost:${config.webhookPort}${config.webhookPath}`)
  if (!config.webhookSecret) {
    console.warn('WEBHOOK_SECRET is not set — all deliveries will be rejected with 401')
  }
})
