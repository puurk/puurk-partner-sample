/**
 * Minimal Puurk REST API client for partner integrations.
 *
 * Handles the service-token flow (POST /auth/token with client_id +
 * client_secret -> 1-hour Bearer JWT), caches the token, refreshes it
 * shortly before expiry, and retries a request once on 401.
 */

const TOKEN_REFRESH_MARGIN_SECONDS = 60

class PuurkApiError extends Error {
  /**
   * @param {string} message Error summary including method, path and status.
   * @param {number} status HTTP status code of the failed response.
   * @param {*} body Parsed response body (or raw text when not JSON).
   * @return {PuurkApiError}
   */
  constructor (message, status, body) {
    super(message)
    this.name = 'PuurkApiError'
    this.status = status
    this.body = body
  }
}

class PuurkClient {
  /**
   * @param {{baseUrl: string, clientId: string, clientSecret: string}} options
   *   Gateway base URL and API client credentials.
   * @return {PuurkClient}
   */
  constructor ({ baseUrl, clientId, clientSecret }) {
    this.baseUrl = baseUrl
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.token = null
    this.tokenExpiresAt = 0
  }

  /**
   * Exchanges client credentials for a service token, bypassing the cache.
   * @return {Promise<{access_token: string, token_type: string, expires_in: number, scopes: Array}>}
   */
  async mintToken () {
    const res = await fetch(`${this.baseUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: this.clientId, client_secret: this.clientSecret })
    })
    const body = await readBody(res)
    if (!res.ok) {
      throw new PuurkApiError(`POST /auth/token failed with ${res.status}`, res.status, body)
    }
    this.token = body.access_token
    this.tokenExpiresAt = Date.now() + ((body.expires_in ?? 3600) - TOKEN_REFRESH_MARGIN_SECONDS) * 1000
    return body
  }

  /**
   * Returns a cached token, minting a fresh one when missing or near expiry.
   * @return {Promise<string>} Bearer access token.
   */
  async getToken () {
    if (!this.token || Date.now() >= this.tokenExpiresAt) await this.mintToken()
    return this.token
  }

  /**
   * Performs an authenticated request against the gateway.
   * @param {string} method HTTP method.
   * @param {string} path Path starting with '/', may include a query string.
   * @param {{body?: object, auth?: boolean}} [options] JSON body and whether
   *   to attach the Bearer token (default true).
   * @return {Promise<*>} Parsed JSON response body.
   */
  async request (method, path, { body, auth = true } = {}) {
    const doFetch = async () => {
      const headers = { 'Content-Type': 'application/json' }
      if (auth) headers.Authorization = `Bearer ${await this.getToken()}`
      return fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      })
    }

    let res = await doFetch()
    if (res.status === 401 && auth) {
      this.token = null
      res = await doFetch()
    }
    const parsed = await readBody(res)
    if (!res.ok) {
      throw new PuurkApiError(`${method} ${path} failed with ${res.status}`, res.status, parsed)
    }
    return parsed
  }

  // --- Auth ---

  /**
   * Validates the current token and returns its claims.
   * @return {Promise<{valid: boolean, api_client_id: string, scopes: Array, key_id: string}>}
   */
  validateToken () { return this.request('GET', '/auth/validate') }

  // --- Clients (leads) ---

  /**
   * Lists clients for an organization.
   * @param {string} oid Organization id.
   * @param {{cursor?: string, limit?: number}} [params] Pagination.
   * @return {Promise<{data: Array, pagination: object}>}
   */
  listOrgClients (oid, params = {}) {
    return this.request('GET', `/organizations/${oid}/leads${query(params)}`)
  }

  /**
   * Searches an organization's clients by free text (name, email, or phone).
   * Named filters (first_name, last_name, email_address, phone_number) are
   * also accepted as an object instead of a string.
   * @param {string} oid Organization id.
   * @param {string|object} q Free-text search term or named-filter object.
   * @return {Promise<{data: Array}>}
   */
  findOrgClients (oid, q) {
    const params = typeof q === 'string' ? { q } : q
    return this.request('GET', `/organizations/${oid}/leads/find${query(params)}`)
  }

  /**
   * Fetches a single client.
   * @param {string} leadId Client (lead) id.
   * @return {Promise<object>}
   */
  getClient (leadId) { return this.request('GET', `/leads/${leadId}`) }

  // --- Contracts (payment plans) ---

  /**
   * Lists an organization's contracts.
   * @param {string} oid Organization id.
   * @param {{cursor?: string, limit?: number}} [params] Pagination.
   * @return {Promise<{data: Array, pagination: object}>}
   */
  listOrgContracts (oid, params = {}) {
    return this.request('GET', `/organizations/${oid}/contracts${query(params)}`)
  }

  /**
   * Fetches a single contract.
   * @param {string} contractId Contract id.
   * @return {Promise<object>}
   */
  getContract (contractId) { return this.request('GET', `/contracts/${contractId}`) }

  // --- Offers ---

  /**
   * Lists an organization's offers.
   * @param {string} oid Organization id.
   * @param {{day?: string, start_date?: string, end_date?: string, lead_id?: string, cursor?: string, limit?: number}} [params]
   *   Optional date filters and pagination.
   * @return {Promise<{data: Array, pagination: object}>}
   */
  listOrgOffers (oid, params = {}) {
    return this.request('GET', `/organizations/${oid}/offers${query(params)}`)
  }

  /**
   * Fetches a single offer.
   * @param {string} offerId Offer id.
   * @return {Promise<object>}
   */
  getOffer (offerId) { return this.request('GET', `/offers/${offerId}`) }

  /**
   * Calculates available payment plan terms for a purchase.
   * @param {{purchase_amount: number, oid: string, down_payment?: number}} params
   *   Purchase amounts in cents; oid is required.
   * @return {Promise<{terms: Array}>} Terms options.
   */
  getTerms (params) {
    return this.request('GET', `/offers/terms${query(params)}`)
  }

  // --- Payments ---

  /**
   * Fetches a single payment.
   * @param {string} paymentId Payment id.
   * @return {Promise<object>}
   */
  getPayment (paymentId) { return this.request('GET', `/payments/${paymentId}`) }

  /**
   * Lists payments recorded against a contract.
   * @param {string} contractId Contract id.
   * @return {Promise<Array>}
   */
  listContractPayments (contractId) { return this.request('GET', `/contracts/${contractId}/payments`) }

  /**
   * Lists payments recorded against an offer.
   * @param {string} offerId Offer id.
   * @return {Promise<Array>}
   */
  listOfferPayments (offerId) { return this.request('GET', `/offers/${offerId}/payments`) }

  // --- Webhooks ---

  /**
   * Lists the partner's registered webhook endpoints (secrets masked).
   * @return {Promise<Array>}
   */
  listWebhooks () { return this.request('GET', '/webhooks') }

  /**
   * Registers a webhook endpoint.
   * @param {{url: string, events: string[], secret?: string}} body HTTPS
   *   delivery URL, subscribed event types, optional self-supplied secret.
   * @return {Promise<object>} Created endpoint; the only response that
   *   includes the full secret.
   */
  createWebhook (body) { return this.request('POST', '/webhooks', { body }) }

  /**
   * Deactivates a webhook endpoint (soft delete).
   * @param {string} id Webhook endpoint id.
   * @return {Promise<{id: string, active: boolean}>}
   */
  deleteWebhook (id) { return this.request('DELETE', `/webhooks/${id}`) }

  // --- Health ---

  /**
   * Probes a backend service health endpoint (public).
   * @param {string} service Service name, e.g. 'payments', 'leads', 'webhook'.
   * @return {Promise<*>}
   */
  health (service) { return this.request('GET', `/health/${service}`, { auth: false }) }
}

/**
 * Builds a query string from defined params.
 * @param {object} params Key/value pairs; undefined/null/'' values are skipped.
 * @return {string} '?k=v&...' or '' when empty.
 */
function query (params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}

/**
 * Reads a response body as JSON, falling back to text.
 * @param {Response} res Fetch response.
 * @return {Promise<*>} Parsed JSON, raw text, or null when empty.
 */
async function readBody (res) {
  const text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return text }
}

module.exports = { PuurkClient, PuurkApiError }
