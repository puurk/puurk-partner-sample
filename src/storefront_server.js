/**
 * Example merchant storefront server (`npm run storefront`). The app itself
 * is built in ./storefront_app.js; this file checks the configuration,
 * starts the listener and warms the catalog.
 */

const { config, requireCredentials } = require('./config')
const { PuurkClient } = require('./puurk_client')
const { createStorefrontApp, ENVIRONMENTS } = require('./storefront_app')

requireCredentials()
if (!config.oid) {
  console.error('Missing required environment variable: PUURK_OID (see .env.example)')
  process.exit(1)
}
if (!ENVIRONMENTS.has(config.puurkEnvironment)) {
  console.error(`PUURK_ENVIRONMENT must be one of: ${[...ENVIRONMENTS].join(', ')}`)
  process.exit(1)
}

if (!config.publishableClientId) {
  console.warn('PUURK_PUBLISHABLE_CLIENT_ID is not set: the page will show full prices only, without Puurk payment plan pricing.')
}

const { app, getCatalog } = createStorefrontApp({ config, client: new PuurkClient(config) })

app.listen(config.storefrontPort, () => {
  console.log(`Storefront running at http://localhost:${config.storefrontPort}`)
  console.log(`  API: ${config.baseUrl} | org: ${config.oid} | checkout environment: ${config.puurkEnvironment}`)
  // Warm the catalog so the first page load is fast and config problems surface early.
  getCatalog().then(
    items => console.log(`  Catalog: ${items.length} sellable service(s)`),
    e => console.error(`  Catalog warm-up failed: ${e.status ?? ''} ${e.message}`)
  )
})
