/**
 * Example merchant storefront: a med-spa website that lists the
 * organization's services with prices and takes Puurk checkout inline on
 * the page with @puurk/js (`Puurk.checkout.mount`).
 *
 * Pricing on the page ("as low as", what each treatment adds to the cart,
 * the cart summary) comes from the @puurk/js widgets, using a publishable
 * client id. The server holds the secret API credential and does what the
 * merchant wants to keep server-side:
 *   1. curate the online menu from the live catalog (GET /api/services)
 *   2. create the checkout session from the cart's items, with an
 *      idempotency key and its own metadata (POST /api/checkout). Puurk
 *      prices the items: amount, down payment and plan lengths all come
 *      from the services.
 *   3. look up a session's real outcome (GET /api/checkout/:id/status)
 * See static/ for the same site with no server at all.
 */

const crypto = require('crypto')
const path = require('path')
const express = require('express')
const { PuurkApiError } = require('./puurk_client')

const CATALOG_TTL_MS = 10 * 60 * 1000
// Unknown service ids trigger a refresh (the catalog may have changed), but
// at most this often so bad ids can't hammer the API.
const CATALOG_FORCE_REFRESH_MIN_MS = 30 * 1000
const SELLABLE_TYPES = new Set(['service', 'package'])
// Catalog entries that aren't standalone treatments to sell online.
const NOT_FOR_STOREFRONT_PATTERN = /\btest\b|\badd[- ]?on\b|\bper (vial|unit|syringe|ml)\b/i
const ENVIRONMENTS = new Set(['staging', 'demo', 'sandbox', 'production'])
// Dots only separate domain labels, so matching never backtracks quadratically.
const EMAIL_PATTERN = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]+$/
const ATTEMPT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/
const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_PHONE_LENGTH = 32
const MAX_CART_LINES = 20
const MAX_LINE_QUANTITY = 10
// How long, and how many, created sessions stay looked-up-able from the browser.
const SESSION_LOOKUP_TTL_MS = 24 * 60 * 60 * 1000
const MAX_TRACKED_SESSIONS = 1000

const ERROR_MESSAGES = {
  invalidRequest: 'Please check your details and try again.',
  unknownService: 'That treatment is no longer available.',
  merchantNotReady: 'Online payment plans are not available for this treatment right now.',
  catalogUnavailable: 'Our treatment menu is temporarily unavailable.',
  checkoutUnavailable: 'We could not start checkout. Please try again.'
}

// Checkout-service 422 codes that mean the merchant can't take this payment.
const MERCHANT_NOT_READY_CODES = new Set(['no_merchant_account', 'no_payment_method', 'no_plans_generated'])

/**
 * Picks up to `limit` items, taking one per catalog category in turn so the
 * menu stays varied, starting from each category's median-priced item (a
 * representative treatment rather than an add-on or the top-end option).
 * @param {Array<object>} services Puurk services.
 * @param {number} limit Maximum items.
 * @return {Array<object>}
 */
function pickVaried (services, limit) {
  const byCategory = new Map()
  for (const s of [...services].sort((a, b) => a.unit_price - b.unit_price)) {
    const key = (s.category ?? '').trim().toLowerCase()
    if (!byCategory.has(key)) byCategory.set(key, [])
    byCategory.get(key).push(s)
  }
  const queues = [...byCategory.values()].map(q => {
    const median = Math.floor(q.length / 2)
    return [...q.slice(median), ...q.slice(0, median).reverse()]
  })
  const picked = []
  while (picked.length < limit && queues.some(q => q.length > 0)) {
    for (const q of queues) {
      if (picked.length >= limit) break
      if (q.length > 0) picked.push(q.shift())
    }
  }
  return picked
}

/**
 * Chooses what the storefront sells. A real merchant curates its online
 * menu: STOREFRONT_SERVICE_IDS lists it explicitly; otherwise a varied
 * selection between STOREFRONT_MIN_PRICE and STOREFRONT_MAX_PRICE is taken
 * from the full catalog (uncategorized items form their own group).
 * @param {Array<object>} sellable Active, priced services and packages.
 * @param {object} config Storefront settings from src/config.js.
 * @return {Array<object>}
 */
function curate (sellable, config) {
  if (config.storefrontServiceIds.length > 0) {
    const byId = new Map(sellable.map(s => [s.id, s]))
    return config.storefrontServiceIds.map(id => byId.get(id)).filter(Boolean)
  }
  const eligible = sellable.filter(s =>
    s.unit_price >= config.storefrontMinPrice &&
    s.unit_price <= config.storefrontMaxPrice &&
    !NOT_FOR_STOREFRONT_PATTERN.test(s.name))
  const isPackage = s => s.is_package === true || s.type === 'package'
  return [
    ...pickVaried(eligible.filter(s => !isPackage(s)), config.storefrontMaxServices),
    ...pickVaried(eligible.filter(isPackage), config.storefrontMaxPackages)
  ]
}

/**
 * Validates and normalizes the customer details from the checkout form.
 * @param {*} input Request body `customer`.
 * @return {{name: string, email: string, phone?: string}|null} Null when invalid.
 */
function parseCustomer (input) {
  if (!input || typeof input !== 'object') return null
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const phone = typeof input.phone === 'string' ? input.phone.trim() : ''
  if (!name || name.length > MAX_NAME_LENGTH) return null
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) return null
  if (phone.length > MAX_PHONE_LENGTH) return null
  return phone ? { name, email, phone } : { name, email }
}

/**
 * Validates the cart sent by the browser. Only service ids and quantities
 * are accepted; Puurk prices them from its catalog. Duplicate lines are
 * merged.
 * @param {*} input Request body `items`.
 * @param {{allowEmpty?: boolean}} [options] Whether an empty cart is valid.
 * @return {Array<{service_id: string, quantity: number}>|null} Null when invalid.
 */
function parseCartItems (input, { allowEmpty = false } = {}) {
  if (!Array.isArray(input) || input.length > MAX_CART_LINES) return null
  if (input.length === 0 && !allowEmpty) return null
  const quantities = new Map()
  for (const item of input) {
    if (!item || typeof item.service_id !== 'string' || item.service_id.length > 128) return null
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_LINE_QUANTITY) return null
    const quantity = Math.min((quantities.get(item.service_id) ?? 0) + item.quantity, MAX_LINE_QUANTITY)
    quantities.set(item.service_id, quantity)
  }
  return [...quantities].map(([serviceId, quantity]) => ({ service_id: serviceId, quantity }))
}

/**
 * Derives the checkout session's idempotency key. One checkout attempt = one
 * attempt id, so double submits replay the same session, while a changed
 * cart or customer gets a new one.
 * @param {string} attemptId Browser-generated id for this checkout attempt.
 * @param {Array<{service_id: string, quantity: number}>} items Parsed cart.
 * @param {{email: string}} customer Parsed customer.
 * @return {string} Hex SHA-256 digest.
 */
function idempotencyKeyFor (attemptId, items, customer) {
  const cartKey = items.map(item => `${item.service_id}x${item.quantity}`).join(',')
  return crypto.createHash('sha256').update(`${attemptId}:${cartKey}:${customer.email}`).digest('hex')
}

/**
 * Remembers the checkout sessions this server created, so only those can be
 * looked up from the browser. Entries expire after `ttlMs` and the oldest
 * are dropped past `maxSize`, so memory stays bounded. This is in memory
 * for the demo: it's lost on restart (lookups then 404). A real merchant
 * stores the session id with its order instead.
 */
class SessionRegistry {
  /**
   * @param {{ttlMs: number, maxSize: number, now: function(): number}} options
   *   Entry lifetime, maximum entries, and the clock.
   * @return {SessionRegistry}
   */
  constructor ({ ttlMs, maxSize, now }) {
    this.ttlMs = ttlMs
    this.maxSize = maxSize
    this.now = now
    this.createdAt = new Map()
  }

  /**
   * Records a session id this server created.
   * @param {string} sessionId Checkout session id.
   * @return {void}
   */
  add (sessionId) {
    this.prune()
    this.createdAt.delete(sessionId)
    this.createdAt.set(sessionId, this.now())
    while (this.createdAt.size > this.maxSize) {
      this.createdAt.delete(this.createdAt.keys().next().value)
    }
  }

  /**
   * Whether this server created the session and it hasn't aged out.
   * @param {string} sessionId Checkout session id.
   * @return {boolean}
   */
  has (sessionId) {
    const createdAt = this.createdAt.get(sessionId)
    return createdAt !== undefined && this.now() - createdAt < this.ttlMs
  }

  /**
   * Drops expired entries (insertion order is creation order).
   * @return {void}
   */
  prune () {
    for (const [id, createdAt] of this.createdAt) {
      if (this.now() - createdAt < this.ttlMs) break
      this.createdAt.delete(id)
    }
  }

  /** @return {number} Tracked session count. */
  get size () { return this.createdAt.size }
}

/**
 * Builds the storefront app without starting a listener.
 * @param {{config: object, client: object, now?: function(): number}} options
 *   Settings from src/config.js, a PuurkClient (or a stand-in with the same
 *   methods), and the clock (defaults to Date.now).
 * @return {{app: import('express').Express, getCatalog: function, sessions: SessionRegistry}}
 *   The app, the cached catalog loader (for warm-up), and the session registry.
 */
function createStorefrontApp ({ config, client, now = Date.now }) {
  let catalogCache = { items: null, fetchedAt: 0 }
  let catalogInFlight = null
  const sessions = new SessionRegistry({ ttlMs: SESSION_LOOKUP_TTL_MS, maxSize: MAX_TRACKED_SESSIONS, now })

  /**
   * Loads the storefront's menu from the Puurk catalog. Only services Puurk
   * can sell online are offered: active services and packages with a fixed
   * price (adjustable prices are set per plan by the provider).
   * @return {Promise<Array<object>>} Storefront-shaped services.
   */
  async function loadCatalog () {
    const services = await client.listOrgServices(config.oid)
    const sellable = curate((Array.isArray(services) ? services : [])
      .filter(s => s.active !== false &&
        SELLABLE_TYPES.has(s.type) &&
        s.adjustable_price !== true &&
        Number.isInteger(s.unit_price) &&
        s.unit_price > 0), config)

    return sellable
      .map(s => ({
        id: s.id,
        name: s.name,
        description: s.description ?? '',
        category: s.category ?? null,
        type: s.type,
        is_package: s.is_package === true || s.type === 'package',
        unit_price: s.unit_price
      }))
      .sort((a, b) => Number(a.is_package) - Number(b.is_package) || a.unit_price - b.unit_price)
  }

  /**
   * Returns the cached catalog, refreshing it when stale or when forced
   * (forced refreshes are rate-limited).
   * Concurrent callers share one in-flight refresh.
   * @param {{force?: boolean}} [options] Bypass the TTL.
   * @return {Promise<Array<object>>}
   */
  async function getCatalog ({ force = false } = {}) {
    const age = now() - catalogCache.fetchedAt
    const fresh = catalogCache.items && age < CATALOG_TTL_MS
    if (fresh && (!force || age < CATALOG_FORCE_REFRESH_MIN_MS)) return catalogCache.items
    if (!catalogInFlight) {
      catalogInFlight = loadCatalog()
        .then(items => {
          catalogCache = { items, fetchedAt: now() }
          return items
        })
        .finally(() => { catalogInFlight = null })
    }
    return catalogInFlight
  }

  /**
   * Whether every cart item is on the online menu (refreshing the menu once
   * if an id is unknown). Puurk prices the items; this only keeps the cart to
   * what the merchant chose to sell online.
   * @param {Array<{service_id: string, quantity: number}>} items Parsed cart.
   * @return {Promise<boolean>}
   */
  async function onMenu (items) {
    const known = catalog => items.every(item => catalog.some(s => s.id === item.service_id))
    return known(await getCatalog()) || known(await getCatalog({ force: true }))
  }

  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '16kb' }))

  // Browser config: environment, SDK location and the publishable client id.
  // Never the secret API credential.
  app.get('/config.js', (req, res) => {
    const browserConfig = {
      mode: 'server',
      environment: config.puurkEnvironment,
      clientId: config.publishableClientId || undefined,
      oid: config.oid,
      puurkJsUrl: config.puurkJsUrl,
      payInFull: config.storefrontPayInFull,
      apiUrl: config.puurkJsApiUrl || undefined
    }
    res.type('application/javascript').set('Cache-Control', 'no-store')
      .send(`window.STOREFRONT_CONFIG = ${JSON.stringify(browserConfig)};\n`)
  })

  app.get('/api/services', async (req, res) => {
    try {
      res.json({ services: await getCatalog() })
    } catch (e) {
      console.error(`Catalog load failed: ${e.status ?? ''} ${e.message}`)
      res.status(502).json({ error: ERROR_MESSAGES.catalogUnavailable })
    }
  })

  app.post('/api/checkout', async (req, res) => {
    // attempt_id is required: it keys the idempotent session create, so a
    // double submit can never open a second session.
    const { attempt_id: attemptId } = req.body ?? {}
    const items = parseCartItems(req.body?.items)
    const customer = parseCustomer(req.body?.customer)
    if (!items || !customer || typeof attemptId !== 'string' || !ATTEMPT_ID_PATTERN.test(attemptId)) {
      return res.status(400).json({ error: ERROR_MESSAGES.invalidRequest })
    }

    try {
      if (!await onMenu(items)) return res.status(404).json({ error: ERROR_MESSAGES.unknownService })
    } catch (e) {
      console.error(`Catalog load failed: ${e.status ?? ''} ${e.message}`)
      return res.status(502).json({ error: ERROR_MESSAGES.catalogUnavailable })
    }

    const origin = `${req.protocol}://${req.get('host')}`
    try {
      // Only service ids and quantities: Puurk prices them from the catalog,
      // including each service's down payment and plan-length cap.
      const session = await client.createCheckoutSession({
        oid: config.oid,
        items,
        customer,
        return_url: `${origin}/success.html`,
        cancel_url: `${origin}/#treatments`,
        metadata: { source: 'storefront-example' }
      }, idempotencyKeyFor(attemptId, items, customer))
      sessions.add(session.session_id)
      res.status(201).json({ session_id: session.session_id, expires_at: session.expires_at })
    } catch (e) {
      if (e instanceof PuurkApiError) {
        console.error(`Session create failed: ${e.status} ${JSON.stringify(e.body)}`)
        if (e.status === 422 && MERCHANT_NOT_READY_CODES.has(e.body?.code)) {
          return res.status(422).json({ error: ERROR_MESSAGES.merchantNotReady })
        }
        // Puurk no longer sells one of the items online (inactive, repriced
        // per plan, or removed since the menu was cached).
        if (e.status === 422) return res.status(422).json({ error: ERROR_MESSAGES.unknownService })
      } else {
        console.error(`Session create failed: ${e.message}`)
      }
      res.status(502).json({ error: ERROR_MESSAGES.checkoutUnavailable })
    }
  })

  // Server-side source of truth for a session's outcome. The browser asks
  // before offering "Start again": a confirm the browser saw fail (e.g. a
  // network or gateway timeout) may still have completed in Puurk, and
  // restarting would charge the customer twice.
  app.get('/api/checkout/:sessionId/status', async (req, res) => {
    const { sessionId } = req.params
    if (!sessions.has(sessionId)) return res.status(404).json({ error: ERROR_MESSAGES.invalidRequest })
    try {
      const session = await client.getCheckoutSession(sessionId)
      res.set('Cache-Control', 'no-store').json({
        session_id: sessionId,
        status: session.status,
        contract_id: session.contract_id ?? null
      })
    } catch (e) {
      if (e instanceof PuurkApiError && e.status === 410) {
        return res.json({ session_id: sessionId, status: 'expired', contract_id: null })
      }
      console.error(`Session status failed: ${e.status ?? ''} ${e.message}`)
      res.status(502).json({ error: ERROR_MESSAGES.checkoutUnavailable })
    }
  })

  app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }))

  return { app, getCatalog, sessions }
}

module.exports = {
  createStorefrontApp,
  SessionRegistry,
  ENVIRONMENTS,
  ERROR_MESSAGES,
  CATALOG_TTL_MS,
  CATALOG_FORCE_REFRESH_MIN_MS,
  SESSION_LOOKUP_TTL_MS,
  MAX_TRACKED_SESSIONS
}
