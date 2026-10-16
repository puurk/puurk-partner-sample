require('dotenv').config()

const config = {
  baseUrl: (process.env.PUURK_API_BASE_URL || 'https://apisandbox.puurk.com').replace(/\/+$/, ''),
  clientId: process.env.PUURK_CLIENT_ID || '',
  clientSecret: process.env.PUURK_CLIENT_SECRET || '',
  oid: process.env.PUURK_OID || '',
  webhookPort: Number(process.env.WEBHOOK_PORT || 4747),
  webhookPath: process.env.WEBHOOK_PATH || '/webhook',
  webhookSecret: process.env.WEBHOOK_SECRET || '',
  webhookPublicUrl: process.env.WEBHOOK_PUBLIC_URL || '',
  signatureToleranceSeconds: Number(process.env.SIGNATURE_TOLERANCE_SECONDS || 300),
  webhookRateLimitPerMinute: Number(process.env.WEBHOOK_RATE_LIMIT_PER_MINUTE || 600),
  storefrontPort: Number(process.env.STOREFRONT_PORT || 4848),
  // Optional curated menu (comma-separated service ids, in display order).
  // When empty, a varied selection is taken from the catalog instead.
  storefrontServiceIds: (process.env.STOREFRONT_SERVICE_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
  storefrontMaxServices: Number(process.env.STOREFRONT_MAX_SERVICES || 12),
  storefrontMaxPackages: Number(process.env.STOREFRONT_MAX_PACKAGES || 4),
  storefrontMinPrice: Number(process.env.STOREFRONT_MIN_PRICE || 10000),
  storefrontMaxPrice: Number(process.env.STOREFRONT_MAX_PRICE || 2500000),
  // Offer "Pay in full" in the embedded checkout. Set to false when full
  // payments are taken through another channel.
  storefrontPayInFull: process.env.STOREFRONT_PAY_IN_FULL !== 'false',
  // Publishable client id for the @puurk/js pricing widgets. Safe to send
  // to the browser: Puurk only accepts it from its allowed origins, for this
  // organization. Prices, down payments and plan lengths all come from the
  // services in Puurk.
  publishableClientId: process.env.PUURK_PUBLISHABLE_CLIENT_ID || '',
  // @puurk/js environment the browser checkout talks to; must match the
  // environment PUURK_API_BASE_URL points at.
  puurkEnvironment: process.env.PUURK_ENVIRONMENT || 'sandbox',
  // Where the browser loads @puurk/js from. Defaults to the vendored build.
  puurkJsUrl: process.env.PUURK_JS_URL || '/vendor/puurk.js',
  // Local testing only: point the browser SDK at another checkout API (e.g.
  // a local emulator). Empty uses the environment's default gateway.
  puurkJsApiUrl: process.env.PUURK_JS_API_URL || ''
}

function requireCredentials () {
  const missing = []
  if (!config.clientId) missing.push('PUURK_CLIENT_ID')
  if (!config.clientSecret) missing.push('PUURK_CLIENT_SECRET')
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')} (see .env.example)`)
    process.exit(1)
  }
}

module.exports = { config, requireCredentials }
