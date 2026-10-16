import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computeSignature, parseSignatureHeader, verifyWebhookSignature } from '../src/verify_signature.js'

const SECRET = 'whsec_test'

describe('parseSignatureHeader', () => {
  it('parses t and v1', () => {
    expect(parseSignatureHeader('t=1700000000,v1=abc123')).toEqual({ t: 1700000000, v1: 'abc123' })
  })

  it('tolerates whitespace and unknown parts in any order', () => {
    expect(parseSignatureHeader(' v0=old , v1=abc , t=12 ')).toEqual({ t: 12, v1: 'abc' })
  })

  it.each([
    ['undefined', undefined],
    ['empty', ''],
    ['non-string', 42],
    ['missing v1', 't=12'],
    ['missing t', 'v1=abc'],
    ['non-numeric t', 't=soon,v1=abc'],
    ['no equals signs', 'garbage']
  ])('returns null when %s', (_label, header) => {
    expect(parseSignatureHeader(header)).toBeNull()
  })
})

describe('computeSignature', () => {
  it('is hex HMAC-SHA256 over "<timestamp>.<raw body>"', () => {
    const body = Buffer.from('{"id":"evt_1"}')
    const expected = createHmac('sha256', SECRET).update('1700000000.{"id":"evt_1"}').digest('hex')
    expect(computeSignature(SECRET, 1700000000, body)).toBe(expected)
  })
})

describe('verifyWebhookSignature', () => {
  const body = Buffer.from('{"id":"evt_1"}')

  afterEach(() => {
    vi.useRealTimers()
  })

  function params (overrides = {}) {
    const timestamp = Math.floor(Date.now() / 1000)
    return {
      secret: SECRET,
      timestamp,
      rawBody: body,
      expectedHex: computeSignature(SECRET, timestamp, body),
      toleranceSeconds: 300,
      ...overrides
    }
  }

  it('accepts a valid signature', () => {
    expect(verifyWebhookSignature(params())).toEqual({ ok: true })
  })

  it('rejects when no secret is configured', () => {
    expect(verifyWebhookSignature(params({ secret: '' }))).toEqual({ ok: false, reason: 'WEBHOOK_SECRET not configured' })
  })

  it('rejects when the raw body is not a Buffer', () => {
    expect(verifyWebhookSignature(params({ rawBody: '{"id":"evt_1"}' }))).toEqual({ ok: false, reason: 'raw body unavailable' })
  })

  it('rejects a signature made with another secret', () => {
    const p = params()
    p.expectedHex = computeSignature('whsec_other', p.timestamp, body)
    expect(verifyWebhookSignature(p)).toEqual({ ok: false, reason: 'signature mismatch' })
  })

  it('rejects a tampered body', () => {
    expect(verifyWebhookSignature(params({ rawBody: Buffer.from('{"id":"evt_2"}') })).reason).toBe('signature mismatch')
  })

  it('rejects a signature of the wrong length without throwing', () => {
    expect(verifyWebhookSignature(params({ expectedHex: 'abc' }))).toEqual({ ok: false, reason: 'signature length mismatch' })
  })

  it('rejects a timestamp outside the tolerance', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'))
    const timestamp = Math.floor(Date.now() / 1000) - 301
    const result = verifyWebhookSignature(params({ timestamp, expectedHex: computeSignature(SECRET, timestamp, body) }))
    expect(result).toEqual({ ok: false, reason: 'timestamp drift 301s exceeds tolerance 300s' })
  })

  it('skips the drift check when the tolerance is 0', () => {
    const timestamp = 1000
    const result = verifyWebhookSignature(params({ timestamp, expectedHex: computeSignature(SECRET, timestamp, body), toleranceSeconds: 0 }))
    expect(result).toEqual({ ok: true })
  })
})
