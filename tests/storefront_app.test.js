import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Load through Node's require, as storefront_app.js does, so PuurkApiError is
// the same class the app checks with instanceof (an ESM import of the
// CommonJS module would be a second copy).
const require = createRequire(import.meta.url)
const { PuurkApiError } = require('../src/puurk_client.js')
const {
  CATALOG_FORCE_REFRESH_MIN_MS,
  CATALOG_TTL_MS,
  createStorefrontApp,
  ERROR_MESSAGES,
  SessionRegistry
} = require('../src/storefront_app.js')

const ATTEMPT_ID = 'attempt-0001'
const CUSTOMER = { name: 'Jane Doe', email: 'Jane@Example.com ' }

function service (overrides = {}) {
  return { id: 's_1', name: 'Hydrafacial', type: 'service', category: 'Facials', unit_price: 25000, active: true, ...overrides }
}

function baseConfig (overrides = {}) {
  return {
    oid: 'org_1',
    puurkEnvironment: 'sandbox',
    publishableClientId: 'pk_1',
    puurkJsUrl: '/vendor/puurk.js',
    puurkJsApiUrl: '',
    storefrontPayInFull: true,
    storefrontServiceIds: [],
    storefrontMaxServices: 12,
    storefrontMaxPackages: 4,
    storefrontMinPrice: 10000,
    storefrontMaxPrice: 2500000,
    ...overrides
  }
}

function fakeClient (services = [service()]) {
  return {
    listOrgServices: vi.fn().mockResolvedValue(services),
    createCheckoutSession: vi.fn().mockResolvedValue({ session_id: 'cs_1', expires_at: '2026-10-16T00:00:00Z' }),
    getCheckoutSession: vi.fn().mockResolvedValue({ session_id: 'cs_1', status: 'complete', contract_id: 'c_1' })
  }
}

describe('storefront app', () => {
  let clock
  let client
  let config
  let storefront

  function build () {
    storefront = createStorefrontApp({ config, client, now: () => clock })
    return storefront.app
  }

  function checkout (body) {
    return request(storefront.app).post('/api/checkout').send({
      items: [{ service_id: 's_1', quantity: 1 }],
      attempt_id: ATTEMPT_ID,
      customer: CUSTOMER,
      ...body
    })
  }

  beforeEach(() => {
    clock = Date.parse('2026-10-15T12:00:00Z')
    client = fakeClient()
    config = baseConfig()
    build()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /config.js', () => {
    it('exposes only browser-safe settings', async () => {
      const res = await request(storefront.app).get('/config.js')
      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/application\/javascript/)
      expect(res.headers['cache-control']).toBe('no-store')
      const json = JSON.parse(res.text.match(/^window\.STOREFRONT_CONFIG = (.*);\n$/)[1])
      expect(json).toEqual({ mode: 'server', environment: 'sandbox', clientId: 'pk_1', oid: 'org_1', puurkJsUrl: '/vendor/puurk.js', payInFull: true })
    })

    it('does not send the x-powered-by header', async () => {
      const res = await request(storefront.app).get('/config.js')
      expect(res.headers['x-powered-by']).toBeUndefined()
    })
  })

  describe('GET /api/services (menu)', () => {
    it('keeps only active, fixed-price services and packages, in storefront shape', async () => {
      client.listOrgServices.mockResolvedValue([
        service({ id: 'ok', description: 'Glow', extra: 'dropped' }),
        service({ id: 'inactive', active: false }),
        service({ id: 'product', type: 'product' }),
        service({ id: 'adjustable', adjustable_price: true }),
        service({ id: 'fractional', unit_price: 100.5 }),
        service({ id: 'free', unit_price: 0 })
      ])

      const res = await request(storefront.app).get('/api/services')

      expect(res.status).toBe(200)
      expect(client.listOrgServices).toHaveBeenCalledWith('org_1')
      expect(res.body.services).toEqual([{
        id: 'ok', name: 'Hydrafacial', description: 'Glow', category: 'Facials', type: 'service', is_package: false, unit_price: 25000
      }])
    })

    it('drops items outside the price range or not sold as standalone treatments', async () => {
      client.listOrgServices.mockResolvedValue([
        service({ id: 'cheap', unit_price: 9999 }),
        service({ id: 'pricey', unit_price: 2500001 }),
        service({ id: 'test', name: 'Test service' }),
        service({ id: 'addon', name: 'Dermaplane add-on' }),
        service({ id: 'vial', name: 'Botox per unit' }),
        service({ id: 'keep', name: 'Microneedling' })
      ])

      const res = await request(storefront.app).get('/api/services')

      expect(res.body.services.map(s => s.id)).toEqual(['keep'])
    })

    it('lists services before packages, each by price', async () => {
      client.listOrgServices.mockResolvedValue([
        service({ id: 'pkg', type: 'package', unit_price: 50000 }),
        service({ id: 'b', unit_price: 30000, category: 'Lasers' }),
        service({ id: 'a', unit_price: 20000 })
      ])

      const res = await request(storefront.app).get('/api/services')

      expect(res.body.services.map(s => [s.id, s.is_package])).toEqual([['a', false], ['b', false], ['pkg', true]])
    })

    it('rotates through categories from each category\'s median-priced item', async () => {
      config = baseConfig({ storefrontMaxServices: 3 })
      client.listOrgServices.mockResolvedValue([
        service({ id: 'f1', category: 'Facials', unit_price: 10000 }),
        service({ id: 'f2', category: 'Facials', unit_price: 20000 }),
        service({ id: 'f3', category: 'Facials', unit_price: 30000 }),
        service({ id: 'l1', category: 'Lasers', unit_price: 40000 }),
        service({ id: 'l2', category: ' lasers ', unit_price: 50000 })
      ])
      build()

      const res = await request(storefront.app).get('/api/services')

      // Facials median f2 and Lasers median l2 first, then the next Facials item above the median.
      expect(res.body.services.map(s => s.id).sort()).toEqual(['f2', 'f3', 'l2'])
    })

    it('caps packages separately from services', async () => {
      config = baseConfig({ storefrontMaxServices: 1, storefrontMaxPackages: 1 })
      client.listOrgServices.mockResolvedValue([
        service({ id: 's1' }), service({ id: 's2', category: 'Lasers' }),
        service({ id: 'p1', type: 'package' }), service({ id: 'p2', is_package: true, category: 'Bundles' })
      ])
      build()

      const res = await request(storefront.app).get('/api/services')

      expect(res.body.services.filter(s => !s.is_package)).toHaveLength(1)
      expect(res.body.services.filter(s => s.is_package)).toHaveLength(1)
    })

    it('uses STOREFRONT_SERVICE_IDS as the menu, skipping ids that aren\'t sellable', async () => {
      config = baseConfig({ storefrontServiceIds: ['s_3', 'missing', 's_1'] })
      client.listOrgServices.mockResolvedValue([
        service({ id: 's_1', unit_price: 500 }), // below the price range, still listed when curated
        service({ id: 's_2' }),
        service({ id: 's_3', unit_price: 40000 })
      ])
      build()

      const res = await request(storefront.app).get('/api/services')

      expect(res.body.services.map(s => s.id)).toEqual(['s_1', 's_3'])
    })

    it('treats a non-array catalog response as empty', async () => {
      client.listOrgServices.mockResolvedValue({ data: [] })
      const res = await request(storefront.app).get('/api/services')
      expect(res.body).toEqual({ services: [] })
    })

    it('returns 502 when the catalog can\'t be loaded', async () => {
      client.listOrgServices.mockRejectedValue(new PuurkApiError('GET failed with 500', 500, null))
      const res = await request(storefront.app).get('/api/services')
      expect(res.status).toBe(502)
      expect(res.body).toEqual({ error: ERROR_MESSAGES.catalogUnavailable })
    })
  })

  describe('catalog cache', () => {
    it('serves the cached catalog until the TTL passes', async () => {
      await storefront.getCatalog()
      clock += CATALOG_TTL_MS - 1
      await storefront.getCatalog()
      expect(client.listOrgServices).toHaveBeenCalledTimes(1)

      clock += 1
      await storefront.getCatalog()
      expect(client.listOrgServices).toHaveBeenCalledTimes(2)
    })

    it('shares one in-flight load between concurrent callers', async () => {
      await Promise.all([storefront.getCatalog(), storefront.getCatalog(), storefront.getCatalog()])
      expect(client.listOrgServices).toHaveBeenCalledTimes(1)
    })

    it('rate limits forced refreshes', async () => {
      await storefront.getCatalog()
      await storefront.getCatalog({ force: true })
      expect(client.listOrgServices).toHaveBeenCalledTimes(1)

      clock += CATALOG_FORCE_REFRESH_MIN_MS
      await storefront.getCatalog({ force: true })
      expect(client.listOrgServices).toHaveBeenCalledTimes(2)
    })

    it('retries the load on the next call after a failure', async () => {
      client.listOrgServices.mockRejectedValueOnce(new Error('network'))
      await expect(storefront.getCatalog()).rejects.toThrow('network')
      await expect(storefront.getCatalog()).resolves.toHaveLength(1)
    })
  })

  describe('POST /api/checkout', () => {
    it('creates an idempotent session from service ids and quantities only', async () => {
      const res = await checkout({ items: [{ service_id: 's_1', quantity: 2, unit_price: 1 }] })

      expect(res.status).toBe(201)
      expect(res.body).toEqual({ session_id: 'cs_1', expires_at: '2026-10-16T00:00:00Z' })
      const [body, idempotencyKey] = client.createCheckoutSession.mock.calls[0]
      expect(body).toEqual({
        oid: 'org_1',
        items: [{ service_id: 's_1', quantity: 2 }],
        customer: { name: 'Jane Doe', email: 'jane@example.com' },
        return_url: expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+\/success\.html$/),
        cancel_url: expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+\/#treatments$/),
        metadata: { source: 'storefront-example' }
      })
      expect(idempotencyKey).toBe(createHash('sha256').update(`${ATTEMPT_ID}:s_1x2:jane@example.com`).digest('hex'))
    })

    it('keeps an optional phone number', async () => {
      await checkout({ customer: { ...CUSTOMER, phone: ' 555-0100 ' } })
      expect(client.createCheckoutSession.mock.calls[0][0].customer).toEqual({ name: 'Jane Doe', email: 'jane@example.com', phone: '555-0100' })
    })

    it('reuses the idempotency key for a double submit, and changes it with the cart or customer', async () => {
      await checkout()
      await checkout()
      await checkout({ items: [{ service_id: 's_1', quantity: 3 }] })
      await checkout({ customer: { ...CUSTOMER, email: 'other@example.com' } })
      await checkout({ attempt_id: 'attempt-0002' })

      const keys = client.createCheckoutSession.mock.calls.map(([, key]) => key)
      expect(keys[0]).toBe(keys[1])
      expect(new Set(keys.slice(1)).size).toBe(4)
    })

    it('merges duplicate cart lines and caps each line at 10', async () => {
      await checkout({ items: [{ service_id: 's_1', quantity: 6 }, { service_id: 's_1', quantity: 7 }] })
      expect(client.createCheckoutSession.mock.calls[0][0].items).toEqual([{ service_id: 's_1', quantity: 10 }])
    })

    it.each([
      ['no attempt id', { attempt_id: undefined }],
      ['a malformed attempt id', { attempt_id: 'bad id!' }],
      ['a too-short attempt id', { attempt_id: 'abc' }],
      ['a non-string attempt id', { attempt_id: 12345678 }],
      ['an empty cart', { items: [] }],
      ['a cart that isn\'t an array', { items: { service_id: 's_1', quantity: 1 } }],
      ['more than 20 cart lines', { items: Array.from({ length: 21 }, (_, i) => ({ service_id: `s_${i}`, quantity: 1 })) }],
      ['a zero quantity', { items: [{ service_id: 's_1', quantity: 0 }] }],
      ['a quantity over 10', { items: [{ service_id: 's_1', quantity: 11 }] }],
      ['a fractional quantity', { items: [{ service_id: 's_1', quantity: 1.5 }] }],
      ['a non-string service id', { items: [{ service_id: 1, quantity: 1 }] }],
      ['an over-long service id', { items: [{ service_id: 'x'.repeat(129), quantity: 1 }] }],
      ['no customer', { customer: undefined }],
      ['a blank name', { customer: { ...CUSTOMER, name: '  ' } }],
      ['an over-long name', { customer: { ...CUSTOMER, name: 'x'.repeat(101) } }],
      ['an invalid email', { customer: { ...CUSTOMER, email: 'jane@example' } }],
      ['an over-long phone', { customer: { ...CUSTOMER, phone: '1'.repeat(33) } }]
    ])('rejects %s with 400', async (_label, body) => {
      const res = await checkout(body)
      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: ERROR_MESSAGES.invalidRequest })
      expect(client.createCheckoutSession).not.toHaveBeenCalled()
    })

    it('rejects an email address without hanging on a pathological input', async () => {
      const started = performance.now()
      const res = await checkout({ customer: { ...CUSTOMER, email: `a@${'b.'.repeat(120)}` } })
      expect(res.status).toBe(400)
      expect(performance.now() - started).toBeLessThan(1000)
    })

    it('returns 404 for an item that isn\'t on the menu, after one forced refresh', async () => {
      await storefront.getCatalog()
      clock += CATALOG_FORCE_REFRESH_MIN_MS

      const res = await checkout({ items: [{ service_id: 'gone', quantity: 1 }] })

      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: ERROR_MESSAGES.unknownService })
      expect(client.listOrgServices).toHaveBeenCalledTimes(2)
      expect(client.createCheckoutSession).not.toHaveBeenCalled()
    })

    it('accepts an item that a refresh adds to the menu', async () => {
      await storefront.getCatalog()
      clock += CATALOG_FORCE_REFRESH_MIN_MS
      client.listOrgServices.mockResolvedValue([service(), service({ id: 's_new', category: 'New' })])

      const res = await checkout({ items: [{ service_id: 's_new', quantity: 1 }] })

      expect(res.status).toBe(201)
    })

    it('returns 502 when the menu can\'t be loaded', async () => {
      client.listOrgServices.mockRejectedValue(new Error('network'))
      const res = await checkout()
      expect(res.status).toBe(502)
      expect(res.body).toEqual({ error: ERROR_MESSAGES.catalogUnavailable })
    })

    it.each(['no_merchant_account', 'no_payment_method', 'no_plans_generated'])(
      'maps a 422 %s to "merchant not ready"', async code => {
        client.createCheckoutSession.mockRejectedValue(new PuurkApiError('POST failed with 422', 422, { code }))
        const res = await checkout()
        expect(res.status).toBe(422)
        expect(res.body).toEqual({ error: ERROR_MESSAGES.merchantNotReady })
      })

    it('maps any other 422 to "no longer available"', async () => {
      client.createCheckoutSession.mockRejectedValue(new PuurkApiError('POST failed with 422', 422, { code: 'service_inactive' }))
      const res = await checkout()
      expect(res.status).toBe(422)
      expect(res.body).toEqual({ error: ERROR_MESSAGES.unknownService })
    })

    it.each([
      ['an API error', new PuurkApiError('POST failed with 500', 500, { error: 'boom' })],
      ['a network error', new Error('fetch failed')]
    ])('returns 502 for %s without leaking details', async (_label, error) => {
      client.createCheckoutSession.mockRejectedValue(error)
      const res = await checkout()
      expect(res.status).toBe(502)
      expect(res.body).toEqual({ error: ERROR_MESSAGES.checkoutUnavailable })
    })

    it('rejects an oversized request body', async () => {
      const res = await checkout({ padding: 'x'.repeat(17 * 1024) })
      expect(res.status).toBe(413)
    })
  })

  describe('GET /api/checkout/:sessionId/status', () => {
    it('returns the real status of a session this server created', async () => {
      await checkout()

      const res = await request(storefront.app).get('/api/checkout/cs_1/status')

      expect(res.status).toBe(200)
      expect(res.headers['cache-control']).toBe('no-store')
      expect(res.body).toEqual({ session_id: 'cs_1', status: 'complete', contract_id: 'c_1' })
      expect(client.getCheckoutSession).toHaveBeenCalledWith('cs_1')
    })

    it('returns a null contract id when the session has none', async () => {
      client.getCheckoutSession.mockResolvedValue({ session_id: 'cs_1', status: 'open' })
      await checkout()
      const res = await request(storefront.app).get('/api/checkout/cs_1/status')
      expect(res.body).toEqual({ session_id: 'cs_1', status: 'open', contract_id: null })
    })

    it('refuses sessions this server did not create', async () => {
      const res = await request(storefront.app).get('/api/checkout/cs_someone_else/status')
      expect(res.status).toBe(404)
      expect(client.getCheckoutSession).not.toHaveBeenCalled()
    })

    it('reports an expired session (410) as expired', async () => {
      client.getCheckoutSession.mockRejectedValue(new PuurkApiError('GET failed with 410', 410, null))
      await checkout()
      const res = await request(storefront.app).get('/api/checkout/cs_1/status')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ session_id: 'cs_1', status: 'expired', contract_id: null })
    })

    it('returns 502 when the lookup fails', async () => {
      client.getCheckoutSession.mockRejectedValue(new PuurkApiError('GET failed with 500', 500, null))
      await checkout()
      const res = await request(storefront.app).get('/api/checkout/cs_1/status')
      expect(res.status).toBe(502)
      expect(res.body).toEqual({ error: ERROR_MESSAGES.checkoutUnavailable })
    })

    it('forgets sessions after a day', async () => {
      await checkout()
      clock += 24 * 60 * 60 * 1000
      const res = await request(storefront.app).get('/api/checkout/cs_1/status')
      expect(res.status).toBe(404)
    })
  })

  it('serves the storefront page', async () => {
    const res = await request(storefront.app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/<html/i)
  })
})

describe('SessionRegistry', () => {
  let clock
  let registry

  beforeEach(() => {
    clock = 0
    registry = new SessionRegistry({ ttlMs: 1000, maxSize: 3, now: () => clock })
  })

  it('remembers sessions until they age out', () => {
    registry.add('a')
    clock = 999
    expect(registry.has('a')).toBe(true)
    clock = 1000
    expect(registry.has('a')).toBe(false)
    expect(registry.has('never')).toBe(false)
  })

  it('drops the oldest sessions past the size cap', () => {
    for (const id of ['a', 'b', 'c', 'd']) registry.add(id)
    expect(registry.size).toBe(3)
    expect(registry.has('a')).toBe(false)
    expect(registry.has('d')).toBe(true)
  })

  it('prunes expired sessions when new ones are added', () => {
    registry.add('a')
    registry.add('b')
    clock = 1500
    registry.add('c')
    expect(registry.size).toBe(1)
  })

  it('refreshes a session that is added again', () => {
    registry.add('a')
    clock = 900
    registry.add('a')
    clock = 1500
    expect(registry.has('a')).toBe(true)
  })
})
