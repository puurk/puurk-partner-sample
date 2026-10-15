/**
 * Example merchant storefront: a med-spa website that lists the
 * organization's services with prices and takes Puurk checkout inline on
 * the page with @puurk/js (`Puurk.checkout.mount`).
 *
 * The server holds the API credential and does the things a browser must
 * never do itself:
 *   1. read the live catalog and "as low as" pricing (GET /api/services)
 *   2. price the cart and its "as low as" increments (POST /api/cart/quote)
 *   3. create a checkout session at the server-side cart total (POST /api/checkout)
 * The browser only ever receives a session id.
 */

const crypto = require('crypto')
const path = require('path')
const express = require('express')
const { config, requireCredentials } = require('./config')
const { PuurkClient, PuurkApiError } = require('./puurk_client')

const CATALOG_TTL_MS = 10 * 60 * 1000
// Unknown service ids trigger a refresh (the catalog may have changed), but
// at most this often so bad ids can't hammer the API.
const CATALOG_FORCE_REFRESH_MIN_MS = 30 * 1000
const SELLABLE_TYPES = new Set(['service', 'package'])
// Catalog entries that aren't standalone treatments to sell online.
const NOT_FOR_STOREFRONT_PATTERN = /\btest\b|\badd[- ]?on\b|\bper (vial|unit|syringe|ml)\b/i
const ENVIRONMENTS = new Set(['staging', 'demo', 'sandbox', 'production'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ATTEMPT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/
const MAX_NAME_LENGTH = 100
const MAX_PHONE_LENGTH = 32
const MAX_CART_LINES = 20
const MAX_LINE_QUANTITY = 10
// checkout-service rejects session amounts above $1,000,000.
const MAX_CART_TOTAL = 100000000
const TERMS_CACHE_MAX_ENTRIES = 500
const TERMS_FAILURE_TTL_MS = 30 * 1000

const ERROR_MESSAGES = {
  invalidRequest: 'Please check your details and try again.',
  unknownService: 'That treatment is no longer available.',
  cartTooLarge: 'Your cart is too large to check out online. Please call us to book.',
  merchantNotReady: 'Online payment plans are not available for this treatment right now.',
  catalogUnavailable: 'Our treatment menu is temporarily unavailable.',
  checkoutUnavailable: 'We could not start checkout. Please try again.'
}

// Checkout-service 422 codes that mean the merchant can't take this payment.
const MERCHANT_NOT_READY_CODES = new Set(['no_merchant_account', 'no_payment_method', 'no_plans_generated'])

requireCredentials()
if (!config.oid) {
  console.error('Missing required environment variable: PUURK_OID (see .env.example)')
  process.exit(1)
}
if (!ENVIRONMENTS.has(config.puurkEnvironment)) {
  console.error(`PUURK_ENVIRONMENT must be one of: ${[...ENVIRONMENTS].join(', ')}`)
  process.exit(1)
}

const client = new PuurkClient(config)
let catalogCache = { items: null, fetchedAt: 0 }
let catalogInFlight = null
const termsCache = new Map()
// Sessions this server created; only these can be looked up from the browser.
const createdSessionIds = new Set()

/**
 * The down payment collected up front for a price.
 * @param {number} amount Price in cents.
 * @return {number} Down payment in cents.
 */
function downPaymentFor (amount) {
  return Math.round(amount * config.storefrontDownPaymentPercent / 100)
}

/**
 * Finds the lowest monthly payment Puurk offers for a price, after the
 * storefront's down payment.
 * @param {number} amount Price in cents.
 * @return {Promise<{monthly_payment: number, term_length: number, down_payment: number}|null>}
 *   Lowest-payment plan, or null when terms aren't available (e.g. the
 *   credential lacks terms:read, or the amount is too small for a plan).
 */
async function lowestMonthlyPayment (amount) {
  try {
    const downPayment = downPaymentFor(amount)
    const { terms } = await client.getTerms({ purchase_amount: amount, down_payment: downPayment, oid: config.oid })
    const plans = (terms ?? []).filter(t => t.term_length > 1 && t.monthly_payment > 0)
    if (plans.length === 0) return null
    const lowest = plans.reduce((min, t) => (t.monthly_payment < min.monthly_payment ? t : min))
    return { monthly_payment: lowest.monthly_payment, term_length: lowest.term_length, down_payment: downPayment }
  } catch (e) {
    console.warn(`Terms lookup failed for ${amount}: ${e.status ?? e.message}`)
    return null
  }
}

/**
 * Cached "as low as" for an amount. Cart quotes ask for many amounts
 * (cart total, and cart total plus each item), so results are cached and
 * concurrent lookups for the same amount share one request. Failed lookups
 * (null) are cached too, but only briefly.
 * @param {number} amount Price in cents.
 * @return {Promise<{monthly_payment: number, term_length: number, down_payment: number}|null>}
 */
function quoteAmount (amount) {
  const hit = termsCache.get(amount)
  if (hit && Date.now() < hit.expiresAt) return hit.promise
  const promise = lowestMonthlyPayment(amount)
  termsCache.set(amount, { promise, expiresAt: Date.now() + CATALOG_TTL_MS })
  promise.then(result => {
    if (result === null) termsCache.set(amount, { promise, expiresAt: Date.now() + TERMS_FAILURE_TTL_MS })
  })
  if (termsCache.size > TERMS_CACHE_MAX_ENTRIES) termsCache.delete(termsCache.keys().next().value)
  return promise
}

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
 * @return {Array<object>}
 */
function curate (sellable) {
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
 * Loads the storefront's catalog from Puurk with "as low as" pricing attached.
 * @return {Promise<Array<object>>} Storefront-shaped services.
 */
async function loadCatalog () {
  const services = await client.listOrgServices(config.oid)
  const sellable = curate((Array.isArray(services) ? services : [])
    .filter(s => s.active !== false && SELLABLE_TYPES.has(s.type) && Number.isInteger(s.unit_price) && s.unit_price > 0))

  // Terms are looked up only for what's on sale, once per distinct price.
  const prices = [...new Set(sellable.map(s => s.unit_price))]
  const lowestByPrice = new Map(await Promise.all(prices.map(async p => [p, await quoteAmount(p)])))

  return sellable
    .map(s => ({
      id: s.id,
      name: s.name,
      description: s.description ?? '',
      category: s.category ?? null,
      type: s.type,
      is_package: s.is_package === true || s.type === 'package',
      unit_price: s.unit_price,
      as_low_as: lowestByPrice.get(s.unit_price) ?? null
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
  const age = Date.now() - catalogCache.fetchedAt
  const fresh = catalogCache.items && age < CATALOG_TTL_MS
  if (fresh && (!force || age < CATALOG_FORCE_REFRESH_MIN_MS)) return catalogCache.items
  if (!catalogInFlight) {
    catalogInFlight = loadCatalog()
      .then(items => {
        catalogCache = { items, fetchedAt: Date.now() }
        return items
      })
      .finally(() => { catalogInFlight = null })
  }
  return catalogInFlight
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
  if (!EMAIL_PATTERN.test(email)) return null
  if (phone.length > MAX_PHONE_LENGTH) return null
  return phone ? { name, email, phone } : { name, email }
}

/**
 * Validates the cart sent by the browser. Only service ids and quantities
 * are accepted; prices always come from the catalog. Duplicate lines are
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
 * Prices cart items against the catalog (refreshing it once if an id is
 * unknown).
 * @param {Array<{service_id: string, quantity: number}>} items Parsed cart.
 * @return {Promise<{lines: Array<object>, total: number}|null>} Null when an
 *   item isn't for sale.
 */
async function priceCart (items) {
  const find = (catalog, id) => catalog.find(s => s.id === id)
  let catalog = await getCatalog()
  if (items.some(item => !find(catalog, item.service_id))) catalog = await getCatalog({ force: true })
  const lines = []
  for (const item of items) {
    const service = find(catalog, item.service_id)
    if (!service) return null
    lines.push({
      service_id: service.id,
      name: service.name,
      unit_price: service.unit_price,
      quantity: item.quantity,
      line_total: service.unit_price * item.quantity
    })
  }
  return { lines, total: lines.reduce((sum, line) => sum + line.line_total, 0) }
}

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '16kb' }))

// Browser config: environment and SDK location only, never credentials.
app.get('/config.js', (req, res) => {
  const browserConfig = {
    environment: config.puurkEnvironment,
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

// Prices a cart and shows what each catalog item would add to its lowest
// monthly payment. Plan lengths change with the amount, so each increment
// is quoted from live terms for (cart total + item price), not summed.
app.post('/api/cart/quote', async (req, res) => {
  const items = parseCartItems(req.body?.items, { allowEmpty: true })
  if (!items) return res.status(400).json({ error: ERROR_MESSAGES.invalidRequest })

  let cart, catalog
  try {
    cart = await priceCart(items)
    catalog = await getCatalog()
  } catch (e) {
    console.error(`Catalog load failed: ${e.status ?? ''} ${e.message}`)
    return res.status(502).json({ error: ERROR_MESSAGES.catalogUnavailable })
  }
  if (!cart) return res.status(404).json({ error: ERROR_MESSAGES.unknownService })

  const cartLow = cart.total > 0 ? await quoteAmount(cart.total) : null
  const increments = Object.fromEntries(await Promise.all(catalog.map(async service => {
    const low = await quoteAmount(cart.total + service.unit_price)
    const delta = low ? low.monthly_payment - (cartLow?.monthly_payment ?? 0) : null
    return [service.id, { as_low_as: low, delta }]
  })))

  res.set('Cache-Control', 'no-store').json({
    lines: cart.lines,
    total: cart.total,
    as_low_as: cartLow,
    increments
  })
})

app.post('/api/checkout', async (req, res) => {
  const { attempt_id: attemptId } = req.body ?? {}
  const items = parseCartItems(req.body?.items)
  const customer = parseCustomer(req.body?.customer)
  if (!items || !customer || (attemptId !== undefined && !ATTEMPT_ID_PATTERN.test(attemptId))) {
    return res.status(400).json({ error: ERROR_MESSAGES.invalidRequest })
  }

  let cart
  try {
    // Prices always come from the catalog, never from the browser.
    cart = await priceCart(items)
  } catch (e) {
    console.error(`Catalog load failed: ${e.status ?? ''} ${e.message}`)
    return res.status(502).json({ error: ERROR_MESSAGES.catalogUnavailable })
  }
  if (!cart) return res.status(404).json({ error: ERROR_MESSAGES.unknownService })
  if (cart.total > MAX_CART_TOTAL) return res.status(422).json({ error: ERROR_MESSAGES.cartTooLarge })

  const origin = `${req.protocol}://${req.get('host')}`
  // One checkout attempt = one attempt id, so double submits replay the same
  // session, while a changed cart gets a new one.
  const cartKey = cart.lines.map(line => `${line.service_id}x${line.quantity}`).join(',')
  const idempotencyKey = attemptId
    ? crypto.createHash('sha256').update(`${attemptId}:${cartKey}:${customer.email}`).digest('hex')
    : undefined

  try {
    const session = await client.createCheckoutSession({
      oid: config.oid,
      amount: cart.total,
      down_payment: downPaymentFor(cart.total),
      customer,
      services: cart.lines.map(line => ({
        service_id: line.service_id,
        name: line.name,
        quantity: line.quantity,
        amount: line.line_total
      })),
      return_url: `${origin}/success.html`,
      cancel_url: `${origin}/#treatments`,
      metadata: { source: 'storefront-example' }
    }, idempotencyKey)
    createdSessionIds.add(session.session_id)
    res.status(201).json({ session_id: session.session_id, expires_at: session.expires_at })
  } catch (e) {
    if (e instanceof PuurkApiError) {
      console.error(`Session create failed: ${e.status} ${JSON.stringify(e.body)}`)
      if (e.status === 422 && MERCHANT_NOT_READY_CODES.has(e.body?.code)) {
        return res.status(422).json({ error: ERROR_MESSAGES.merchantNotReady })
      }
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
  if (!createdSessionIds.has(sessionId)) return res.status(404).json({ error: ERROR_MESSAGES.invalidRequest })
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

app.listen(config.storefrontPort, () => {
  console.log(`Storefront running at http://localhost:${config.storefrontPort}`)
  console.log(`  API: ${config.baseUrl} | org: ${config.oid} | checkout environment: ${config.puurkEnvironment}`)
  // Warm the catalog so the first page load is fast and config problems surface early.
  getCatalog().then(
    items => console.log(`  Catalog: ${items.length} sellable service(s)`),
    e => console.error(`  Catalog warm-up failed: ${e.status ?? ''} ${e.message}`)
  )
})
