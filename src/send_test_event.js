/**
 * Posts a locally signed sample event to the running webhook receiver so the
 * signature verification path can be exercised without waiting for a real
 * delivery from Puurk.
 */

const { randomUUID } = require('crypto')
const { config } = require('./config')
const { computeSignature } = require('./verify_signature')

async function main () {
  if (!config.webhookSecret) {
    console.error('Set WEBHOOK_SECRET in .env first')
    process.exit(1)
  }

  const event = {
    id: `evt_test_${randomUUID()}`,
    type: 'payment.succeeded',
    created_at: new Date().toISOString(),
    data: {
      payment_id: 'pay_test_123',
      contract_id: 'con_test_123',
      amount: 15000,
      total_amount: 15000,
      status: 'captured',
      method: 'card',
      payment_datetime: new Date().toISOString()
    }
  }

  const rawBody = Buffer.from(JSON.stringify(event), 'utf8')
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = computeSignature(config.webhookSecret, timestamp, rawBody)

  const url = `http://localhost:${config.webhookPort}${config.webhookPath}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Puurk-Signature': `t=${timestamp},v1=${signature}`,
      'User-Agent': 'Puurk-Webhooks/1.0'
    },
    body: rawBody
  })

  console.log(`POST ${url} -> ${res.status}`)
  console.log(await res.text())
  process.exit(res.ok ? 0 : 1)
}

main().catch(err => {
  console.error(`Failed to reach the receiver: ${err.message}`)
  console.error('Is it running? Start it with `npm run webhook`.')
  process.exit(1)
})
