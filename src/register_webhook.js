/**
 * Registers WEBHOOK_PUBLIC_URL as a webhook endpoint for the live event
 * types, supplying WEBHOOK_SECRET so the signing secret stays known to us
 * (GET /webhooks masks server-generated secrets after creation).
 */

const { config, requireCredentials } = require('./config')
const { PuurkClient } = require('./puurk_client')

const LIVE_EVENTS = [
  'checkout.completed',
  'payment.succeeded',
  'payment.failed',
  'payment.returned',
  'payment.refunded',
  'contract.created',
  'contract.signed',
  'contract.fulfilled',
  'contract.canceled'
]

async function main () {
  requireCredentials()
  if (!config.webhookPublicUrl || !config.webhookSecret) {
    console.error('Set WEBHOOK_PUBLIC_URL (https) and WEBHOOK_SECRET in .env first')
    process.exit(1)
  }

  const client = new PuurkClient(config)
  const url = new URL(config.webhookPath, config.webhookPublicUrl).toString()

  const existing = await client.listWebhooks()
  const duplicate = (existing || []).find(e => e.active && e.url === url)
  if (duplicate) {
    console.log(`Endpoint already registered: ${duplicate.id} -> ${duplicate.url}`)
    return
  }

  const created = await client.createWebhook({ url, events: LIVE_EVENTS, secret: config.webhookSecret })
  console.log(`Registered webhook ${created.id}`)
  console.log(`  url:    ${created.url}`)
  console.log(`  events: ${(created.events || []).join(', ')}`)
  console.log('Start the receiver with `npm run webhook` and keep the tunnel open.')
}

main().catch(err => {
  console.error(err.message)
  if (err.body) console.error(JSON.stringify(err.body, null, 2))
  process.exit(1)
})
