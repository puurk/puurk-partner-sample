import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PuurkApiError, PuurkClient } from '../src/puurk_client.js'

const BASE_URL = 'https://api.test'

function jsonResponse (status, body) {
  return new Response(body === undefined ? '' : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

function tokenResponse (token = 'tok_1', expiresIn = 3600) {
  return jsonResponse(200, { access_token: token, token_type: 'Bearer', expires_in: expiresIn, scopes: [] })
}

describe('PuurkClient', () => {
  let fetchMock
  let client

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    client = new PuurkClient({ baseUrl: BASE_URL, clientId: 'client_1', clientSecret: 'secret_1' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  function call (n) {
    const [url, init] = fetchMock.mock.calls[n]
    return { url, init, body: init.body === undefined ? undefined : JSON.parse(init.body) }
  }

  it('mints a token with the client credentials, then sends it as a Bearer header', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(jsonResponse(200, { id: 'lead_1' }))

    await expect(client.getClient('lead_1')).resolves.toEqual({ id: 'lead_1' })

    expect(call(0).url).toBe(`${BASE_URL}/auth/token`)
    expect(call(0).init.method).toBe('POST')
    expect(call(0).body).toEqual({ client_id: 'client_1', client_secret: 'secret_1' })
    expect(call(1).url).toBe(`${BASE_URL}/leads/lead_1`)
    expect(call(1).init.headers.Authorization).toBe('Bearer tok_1')
  })

  it('reuses the cached token across requests', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse(200, {}))
      .mockResolvedValueOnce(jsonResponse(200, {}))

    await client.getOffer('o_1')
    await client.getContract('c_1')

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/token'))).toHaveLength(1)
  })

  it('refreshes the token a minute before it expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'))
    fetchMock.mockResolvedValueOnce(tokenResponse('tok_1', 3600))
      .mockResolvedValueOnce(jsonResponse(200, {}))
      .mockResolvedValueOnce(tokenResponse('tok_2', 3600))
      .mockResolvedValueOnce(jsonResponse(200, {}))

    await client.getOffer('o_1')
    vi.setSystemTime(new Date('2026-10-15T12:59:00Z'))
    await client.getOffer('o_1')

    expect(call(2).url).toBe(`${BASE_URL}/auth/token`)
    expect(call(3).init.headers.Authorization).toBe('Bearer tok_2')
  })

  it('re-mints the token and retries once on 401', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse('tok_1'))
      .mockResolvedValueOnce(jsonResponse(401, { error: 'expired' }))
      .mockResolvedValueOnce(tokenResponse('tok_2'))
      .mockResolvedValueOnce(jsonResponse(200, { valid: true }))

    await expect(client.validateToken()).resolves.toEqual({ valid: true })
    expect(call(3).init.headers.Authorization).toBe('Bearer tok_2')
  })

  it('throws PuurkApiError with status and body when the retry also fails', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse(401, { error: 'nope' }))
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse(401, { error: 'nope' }))

    const error = await client.validateToken().catch(e => e)
    expect(error).toBeInstanceOf(PuurkApiError)
    expect(error.status).toBe(401)
    expect(error.body).toEqual({ error: 'nope' })
    expect(error.message).toBe('GET /auth/validate failed with 401')
  })

  it('throws PuurkApiError when the token exchange fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { error: 'invalid client' }))

    const error = await client.getOffer('o_1').catch(e => e)
    expect(error).toBeInstanceOf(PuurkApiError)
    expect(error.message).toBe('POST /auth/token failed with 403')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not retry a non-401 error', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(jsonResponse(404, { error: 'not found' }))

    await expect(client.getPayment('p_1')).rejects.toMatchObject({ status: 404 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('keeps a non-JSON error body as text', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response('upstream request timeout', { status: 504 }))

    await expect(client.getPayment('p_1')).rejects.toMatchObject({ status: 504, body: 'upstream request timeout' })
  })

  it('sends health probes without auth', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    await client.health('payments')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(call(0).url).toBe(`${BASE_URL}/health/payments`)
    expect(call(0).init.headers.Authorization).toBeUndefined()
  })

  it('builds query strings and skips empty values', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(jsonResponse(200, { data: [] }))

    await client.listOrgOffers('org_1', { start_date: '2026-10-01', lead_id: '', cursor: null, limit: 25 })

    expect(call(1).url).toBe(`${BASE_URL}/organizations/org_1/offers?start_date=2026-10-01&limit=25`)
  })

  it('omits the query string when there are no params', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(jsonResponse(200, { data: [] }))

    await client.listOrgContracts('org_1')

    expect(call(1).url).toBe(`${BASE_URL}/organizations/org_1/contracts`)
  })

  it('searches clients by free text or named filters', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse(200, { data: [] }))
      .mockResolvedValueOnce(jsonResponse(200, { data: [] }))

    await client.findOrgClients('org_1', 'jane doe')
    await client.findOrgClients('org_1', { email_address: 'jane@example.com' })

    expect(call(1).url).toBe(`${BASE_URL}/organizations/org_1/leads/find?q=jane+doe`)
    expect(call(2).url).toBe(`${BASE_URL}/organizations/org_1/leads/find?email_address=jane%40example.com`)
  })

  it('posts a JSON body when registering a webhook', async () => {
    const webhook = { url: 'https://example.com/webhook', events: ['payment.succeeded'] }
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(jsonResponse(201, { id: 'wh_1', secret: 'whsec_x' }))

    await expect(client.createWebhook(webhook)).resolves.toEqual({ id: 'wh_1', secret: 'whsec_x' })
    expect(call(1).init.method).toBe('POST')
    expect(call(1).url).toBe(`${BASE_URL}/webhooks`)
    expect(call(1).body).toEqual(webhook)
  })

  it('lists an organization services with an optional type filter', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse(200, [{ id: 's_1' }]))
      .mockResolvedValueOnce(jsonResponse(200, []))

    await expect(client.listOrgServices('org_1')).resolves.toEqual([{ id: 's_1' }])
    await client.listOrgServices('org_1', { type: 'package' })

    expect(call(1).url).toBe(`${BASE_URL}/organizations/org_1/services`)
    expect(call(2).url).toBe(`${BASE_URL}/organizations/org_1/services?type=package`)
  })

  it('creates a checkout session with an Idempotency-Key header', async () => {
    const body = { oid: 'org_1', items: [{ service_id: 's_1', quantity: 2 }], customer: { email: 'jane@example.com' } }
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(jsonResponse(201, { session_id: 'cs_1' }))

    await expect(client.createCheckoutSession(body, 'key_1')).resolves.toEqual({ session_id: 'cs_1' })

    expect(call(1).url).toBe(`${BASE_URL}/checkout/sessions`)
    expect(call(1).init.method).toBe('POST')
    expect(call(1).body).toEqual(body)
    expect(call(1).init.headers['Idempotency-Key']).toBe('key_1')
    expect(call(1).init.headers.Authorization).toBe('Bearer tok_1')
  })

  it('omits the Idempotency-Key header when no key is given', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(jsonResponse(201, { session_id: 'cs_1' }))

    await client.createCheckoutSession({ oid: 'org_1', items: [] })

    expect(call(1).init.headers).not.toHaveProperty('Idempotency-Key')
  })

  it('resends extra headers when it retries after a 401', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse('tok_1'))
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(tokenResponse('tok_2'))
      .mockResolvedValueOnce(jsonResponse(201, { session_id: 'cs_1' }))

    await client.createCheckoutSession({ oid: 'org_1', items: [] }, 'key_1')

    expect(call(3).init.headers['Idempotency-Key']).toBe('key_1')
    expect(call(3).init.headers.Authorization).toBe('Bearer tok_2')
  })

  it('never lets extra headers replace the Bearer token', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(jsonResponse(200, {}))

    await client.request('GET', '/auth/validate', { headers: { Authorization: 'Bearer spoofed', 'X-Trace': 't_1' } })

    expect(call(1).init.headers.Authorization).toBe('Bearer tok_1')
    expect(call(1).init.headers['X-Trace']).toBe('t_1')
    expect(call(1).init.headers['Content-Type']).toBe('application/json')
  })

  it('fetches a checkout session with the id URL-encoded', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(jsonResponse(200, { session_id: 'cs/1', status: 'open' }))

    await client.getCheckoutSession('cs/1')

    expect(call(1).url).toBe(`${BASE_URL}/checkout/sessions/cs%2F1`)
  })

  it('returns null for an empty success body', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(client.deleteWebhook('wh_1')).resolves.toBeNull()
    expect(call(1).init.method).toBe('DELETE')
  })
})
