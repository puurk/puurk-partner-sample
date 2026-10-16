import { createHmac } from 'node:crypto'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWebhookApp } from '../src/webhook_app.js'

const SECRET = 'whsec_test'

function signatureHeader (body, { secret = SECRET, timestamp = Math.floor(Date.now() / 1000) } = {}) {
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  return `t=${timestamp},v1=${v1}`
}

function event (id = 'evt_1') {
  return JSON.stringify({
    id,
    type: 'payment.succeeded',
    created_at: '2026-10-15T00:00:00Z',
    data: { payment_id: 'p_1', amount: 12500 }
  })
}

describe('webhook receiver app', () => {
  let app

  beforeEach(() => {
    app = createWebhookApp({ webhookPath: '/webhook', webhookSecret: SECRET, signatureToleranceSeconds: 300 })
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function deliver (body, header = signatureHeader(body)) {
    const req = request(app).post('/webhook').set('Content-Type', 'application/json')
    if (header !== null) req.set('X-Puurk-Signature', header)
    return req.send(body)
  }

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('accepts a correctly signed event and logs it', async () => {
    const res = await deliver(event())
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ received: true })
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('payment.succeeded (evt_1)'))
  })

  it('acknowledges a repeated event id as a duplicate', async () => {
    await deliver(event())
    const res = await deliver(event())
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ received: true, duplicate: true })
  })

  it('processes different event ids separately', async () => {
    await deliver(event('evt_1'))
    const res = await deliver(event('evt_2'))
    expect(res.body).toEqual({ received: true })
  })

  it('does not share dedupe state between app instances', async () => {
    await deliver(event())
    const other = createWebhookApp({ webhookPath: '/webhook', webhookSecret: SECRET, signatureToleranceSeconds: 300 })
    const body = event()
    const res = await request(other).post('/webhook').set('Content-Type', 'application/json')
      .set('X-Puurk-Signature', signatureHeader(body)).send(body)
    expect(res.body).toEqual({ received: true })
  })

  it('rejects a delivery without a signature header', async () => {
    const res = await deliver(event(), null)
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'missing or malformed signature header' })
  })

  it('rejects a malformed signature header', async () => {
    const res = await deliver(event(), 'nonsense')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'missing or malformed signature header' })
  })

  it('rejects a signature made with another secret', async () => {
    const body = event()
    const res = await deliver(body, signatureHeader(body, { secret: 'whsec_other' }))
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'signature mismatch' })
  })

  it('rejects a stale timestamp', async () => {
    const body = event()
    const res = await deliver(body, signatureHeader(body, { timestamp: Math.floor(Date.now() / 1000) - 3600 }))
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/exceeds tolerance 300s/)
  })

  it('rejects every delivery when no secret is configured', async () => {
    app = createWebhookApp({ webhookPath: '/webhook', webhookSecret: '', signatureToleranceSeconds: 300 })
    const res = await deliver(event())
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'WEBHOOK_SECRET not configured' })
  })

  it('returns 400 for a correctly signed body that is not JSON', async () => {
    const res = await deliver('not json')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'invalid JSON body' })
  })

  it('mounts the receiver on the configured path', async () => {
    app = createWebhookApp({ webhookPath: '/hooks/puurk', webhookSecret: SECRET, signatureToleranceSeconds: 300 })
    const body = event()
    const res = await request(app).post('/hooks/puurk').set('Content-Type', 'application/json')
      .set('X-Puurk-Signature', signatureHeader(body)).send(body)
    expect(res.status).toBe(200)
    expect((await request(app).post('/webhook').send(body)).status).toBe(404)
  })

  describe('rate limiting', () => {
    beforeEach(() => {
      app = createWebhookApp({ webhookPath: '/webhook', webhookSecret: SECRET, signatureToleranceSeconds: 300, webhookRateLimitPerMinute: 2 })
    })

    it('answers 429 once a client exceeds the per-minute limit', async () => {
      expect((await deliver(event('evt_1'))).status).toBe(200)
      expect((await deliver(event('evt_2'))).status).toBe(200)
      const res = await deliver(event('evt_3'))
      expect(res.status).toBe(429)
      expect(res.body).toEqual({ error: 'too many requests' })
      expect(res.headers['retry-after']).toBeDefined()
      expect(res.headers.ratelimit).toBeDefined()
    })

    it('counts rejected deliveries toward the limit', async () => {
      await deliver(event(), 'nonsense')
      await deliver(event(), 'nonsense')
      expect((await deliver(event())).status).toBe(429)
    })

    it('limits each client IP separately behind a local tunnel', async () => {
      const from = (ip, body) => request(app).post('/webhook').set('Content-Type', 'application/json')
        .set('X-Forwarded-For', ip).set('X-Puurk-Signature', signatureHeader(body)).send(body)
      await from('203.0.113.1', event('evt_1'))
      await from('203.0.113.1', event('evt_2'))
      expect((await from('203.0.113.1', event('evt_3'))).status).toBe(429)
      expect((await from('203.0.113.2', event('evt_4'))).status).toBe(200)
    })

    it('does not limit the health check', async () => {
      for (let i = 0; i < 3; i++) await deliver(event(`evt_${i}`))
      expect((await request(app).get('/health')).status).toBe(200)
    })
  })

  it('does not throttle ordinary traffic under the default limit', async () => {
    for (let i = 0; i < 10; i++) expect((await deliver(event(`evt_${i}`))).status).toBe(200)
  })
})
