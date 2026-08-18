/**
 * End-to-end smoke test for the partner integration surface of the Puurk
 * REST API. Read-only against business data; the only writes are a webhook
 * endpoint registration that is deleted again at the end.
 *
 * Usage: npm run smoke   (requires PUURK_CLIENT_ID / PUURK_CLIENT_SECRET,
 * and PUURK_OID for the org-scoped checks)
 */

const { randomUUID } = require('crypto')
const { config, requireCredentials } = require('./config')
const { PuurkClient } = require('./puurk_client')
const { computeSignature, parseSignatureHeader, verifyWebhookSignature } = require('./verify_signature')

const results = []

const NAME_WIDTH = 50

/**
 * Prints a single check result line as soon as it is known.
 * @param {{name: string, status: string, detail: string}} result Check result.
 * @return {void}
 */
function printResult (result) {
  const mark = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '-'
  console.log(`${mark} ${result.status.padEnd(5)} ${result.name.padEnd(NAME_WIDTH)} ${result.detail}`)
}

/**
 * Runs a named check, printing the outcome immediately so progress is
 * visible while the suite runs.
 * @param {string} name Check name shown in the report.
 * @param {function(): Promise<string|void>} fn Check body; the resolved
 *   string becomes the detail column.
 * @return {Promise<boolean>} Whether the check passed.
 */
async function check (name, fn) {
  let result
  try {
    const detail = await fn()
    result = { name, status: 'PASS', detail: detail || '' }
  } catch (err) {
    const detail = err.body ? `${err.message}: ${JSON.stringify(err.body)}` : err.message
    result = { name, status: 'FAIL', detail }
  }
  results.push(result)
  printResult(result)
  return result.status === 'PASS'
}

/**
 * Records and prints a skipped check.
 * @param {string} name Check name.
 * @param {string} reason Why it was skipped.
 * @return {void}
 */
function skip (name, reason) {
  const result = { name, status: 'SKIP', detail: reason }
  results.push(result)
  printResult(result)
}

/**
 * Asserts a condition, throwing with a message when false.
 * @param {*} condition Value treated as boolean.
 * @param {string} message Failure description.
 * @return {void}
 */
function assert (condition, message) {
  if (!condition) throw new Error(`assertion failed: ${message}`)
}

async function main () {
  requireCredentials()
  const client = new PuurkClient(config)
  console.log(`Running smoke test against ${config.baseUrl}\n`)

  // --- Authentication ---
  const authOk = await check('auth: POST /auth/token', async () => {
    const token = await client.mintToken()
    assert(typeof token.access_token === 'string' && token.access_token.length > 0, 'access_token present')
    assert(/bearer/i.test(token.token_type), `token_type is Bearer (got ${token.token_type})`)
    return `expires_in=${token.expires_in}, scopes=${JSON.stringify(token.scopes ?? [])}`
  })
  if (!authOk) {
    printSummary()
    console.error('\nToken exchange failed — skipping all authenticated checks.')
    process.exit(1)
  }

  await check('auth: GET /auth/validate', async () => {
    const v = await client.validateToken()
    assert(v.valid === true, `token reported valid (got ${JSON.stringify(v.valid)})`)
    return `api_client_id=${v.api_client_id}`
  })

  // --- Service health (public) ---
  for (const service of ['auth', 'leads', 'contract', 'offer', 'payments', 'webhook', 'checkout']) {
    await check(`health: GET /health/${service}`, async () => { await client.health(service) })
  }

  // --- Clients, contracts, offers, payments (org-scoped, read-only) ---
  let firstClient = null
  let contracts = []
  let firstOffer = null
  let anyPayment = null

  if (!config.oid) {
    skip('clients/contracts/offers/payments checks', 'PUURK_OID not set')
  } else {
    await check(`clients: GET /organizations/{oid}/leads`, async () => {
      const page = await client.listOrgClients(config.oid, { limit: 5 })
      assert(Array.isArray(page?.data), 'response has data array')
      assert(page?.pagination && typeof page.pagination.hasMore === 'boolean', 'response has pagination')
      firstClient = page.data[0] ?? null
      return `${page.data.length} returned, hasMore=${page.pagination.hasMore}`
    })

    if (firstClient?.id) {
      await check('clients: GET /leads/{leadId}', async () => {
        const lead = await client.getClient(firstClient.id)
        assert(lead?.id === firstClient.id, 'ids match')
        return `id=${lead.id}`
      })
      await check('clients: GET /organizations/{oid}/leads/find', async () => {
        const lastName = firstClient.last_name || ''
        assert(lastName, 'first client has a last name to search by')
        const found = await client.findOrgClients(config.oid, lastName)
        assert(Array.isArray(found?.data), 'response has data array')
        return `q="${lastName}" -> ${found.data.length} match(es)`
      })
    } else {
      skip('clients: GET /leads/{leadId}', 'org has no clients')
      skip('clients: GET /organizations/{oid}/leads/find', 'org has no clients')
    }

    await check('contracts: GET /organizations/{oid}/contracts', async () => {
      const page = await client.listOrgContracts(config.oid, { limit: 25 })
      assert(Array.isArray(page?.data), 'response has data array')
      assert(page?.pagination && typeof page.pagination.hasMore === 'boolean', 'response has pagination')
      contracts = page.data
      const byStatus = {}
      for (const c of contracts) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1
      return `${contracts.length} contract(s) ${JSON.stringify(byStatus)}`
    })

    if (contracts[0]?.id) {
      await check('contracts: GET /contracts/{contractId}', async () => {
        const c = await client.getContract(contracts[0].id)
        assert(c?.id === contracts[0].id, 'ids match')
        assert('status' in c && 'terms' in c, 'contract has status and terms')
        return `id=${c.id}, status=${c.status}`
      })

      await check('payments: GET /contracts/{contractId}/payments', async () => {
        // Search a few contracts for one that has payments recorded.
        for (const contract of contracts.slice(0, 10)) {
          const payments = await client.listContractPayments(contract.id)
          assert(Array.isArray(payments), 'response is an array')
          if (!anyPayment && payments.length > 0) anyPayment = payments[0]
        }
        return anyPayment ? `found payments (first: ${anyPayment.id})` : 'no payments on first 10 contracts'
      })
    } else {
      skip('contracts: GET /contracts/{contractId}', 'org has no contracts')
      skip('payments: GET /contracts/{contractId}/payments', 'org has no contracts')
    }

    if (anyPayment?.id) {
      await check('payments: GET /payments/{id}', async () => {
        const p = await client.getPayment(anyPayment.id)
        assert(p?.id === anyPayment.id, 'ids match')
        assert('status' in p && 'amount' in p, 'payment has status and amount')
        return `id=${p.id}, status=${p.status}, method=${p.method}`
      })
    } else {
      skip('payments: GET /payments/{id}', 'no payment found to fetch')
    }

    await check('offers: GET /organizations/{oid}/offers', async () => {
      // Newer deployments page offers without a date filter; older ones
      // still require a day or start_date filter.
      let page
      let note = ''
      try {
        page = await client.listOrgOffers(config.oid, { limit: 5 })
      } catch (err) {
        if (err.status !== 400) throw err
        page = await client.listOrgOffers(config.oid, { start_date: '2020-01-01', limit: 5 })
        note = ' (dateless listing not deployed here; used start_date)'
      }
      assert(Array.isArray(page?.data), 'response has data array')
      assert(page?.pagination && typeof page.pagination.hasMore === 'boolean', 'response has pagination')
      firstOffer = page.data[0] ?? null
      return `${page.data.length} returned, hasMore=${page.pagination.hasMore}${note}`
    })

    if (firstOffer?.id) {
      await check('offers: GET /offers/{offerId}', async () => {
        const o = await client.getOffer(firstOffer.id)
        assert(o?.id === firstOffer.id, 'ids match')
        return `id=${o.id}, status=${o.status}`
      })
      await check('payments: GET /offers/{offerId}/payments', async () => {
        const payments = await client.listOfferPayments(firstOffer.id)
        assert(Array.isArray(payments), 'response is an array')
        return `${payments.length} payment(s)`
      })
    } else {
      skip('offers: GET /offers/{offerId}', 'org has no offers')
      skip('payments: GET /offers/{offerId}/payments', 'org has no offers')
    }
  }

  await check('offers: GET /offers/terms', async () => {
    const res = await client.getTerms({ purchase_amount: 250000, down_payment: 25000, oid: config.oid || undefined })
    assert(Array.isArray(res?.terms) && res.terms.length > 0, 'at least one term option returned')
    const t = res.terms[0]
    assert('monthly_payment' in t && 'term_length' in t, 'terms have monthly_payment and term_length')
    return `${res.terms.length} option(s), first: ${t.term_length}mo @ ${t.monthly_payment}`
  })

  // --- Webhook endpoint lifecycle (create -> list -> delete) ---
  const webhookSecret = config.webhookSecret || `whsec_smoke_${randomUUID().replaceAll('-', '')}`
  const webhookUrl = `https://example.com/puurk-smoke-${randomUUID().slice(0, 8)}`
  let createdWebhookId = null

  await check('webhooks: GET /webhooks', async () => {
    const list = await client.listWebhooks()
    assert(Array.isArray(list), 'response is an array')
    return `${list.length} endpoint(s), ${list.filter(e => e.active).length} active`
  })

  await check('webhooks: POST /webhooks', async () => {
    const created = await client.createWebhook({
      url: webhookUrl,
      events: [
        'checkout.completed',
        'payment.succeeded',
        'payment.failed',
        'payment.returned',
        'payment.refunded',
        'contract.created',
        'contract.signed',
        'contract.fulfilled',
        'contract.canceled'
      ],
      secret: webhookSecret
    })
    assert(created?.id, 'created endpoint has id')
    assert(created.secret === webhookSecret, 'self-supplied secret echoed back')
    assert(created.active === true, 'endpoint is active')
    createdWebhookId = created.id
    return `id=${created.id}`
  })

  if (createdWebhookId) {
    await check('webhooks: secret masked on GET', async () => {
      const list = await client.listWebhooks()
      const mine = list.find(e => e.id === createdWebhookId)
      assert(mine, 'created endpoint appears in list')
      assert(mine.secret !== webhookSecret, 'full secret is not exposed on list')
      return `listed secret=${mine.secret}`
    })
    await check('webhooks: DELETE /webhooks/{id}', async () => {
      const deleted = await client.deleteWebhook(createdWebhookId)
      assert(deleted?.active === false, 'endpoint deactivated')
      return `id=${createdWebhookId} deactivated`
    })
  } else {
    skip('webhooks: secret masked on GET', 'create failed')
    skip('webhooks: DELETE /webhooks/{id}', 'create failed')
  }

  // --- Signature scheme roundtrip (local, no network) ---
  await check('webhooks: signature verify roundtrip', async () => {
    const body = Buffer.from(JSON.stringify({ id: 'evt_local', type: 'payment.succeeded', data: {} }), 'utf8')
    const ts = Math.floor(Date.now() / 1000)
    const header = `t=${ts},v1=${computeSignature(webhookSecret, ts, body)}`
    const parsed = parseSignatureHeader(header)
    assert(parsed, 'header parses')
    const good = verifyWebhookSignature({
      secret: webhookSecret, timestamp: parsed.t, rawBody: body, expectedHex: parsed.v1, toleranceSeconds: 300
    })
    assert(good.ok, `valid signature accepted (${good.reason ?? ''})`)
    const tampered = verifyWebhookSignature({
      secret: webhookSecret, timestamp: parsed.t, rawBody: Buffer.concat([body, Buffer.from(' ')]), expectedHex: parsed.v1, toleranceSeconds: 300
    })
    assert(tampered.ok === false, 'tampered body rejected')
    return 'sign + verify + tamper-reject OK'
  })

  printSummary()
  const failed = results.filter(r => r.status === 'FAIL').length
  process.exit(failed > 0 ? 1 : 0)
}

/**
 * Prints the summary counts (individual results are printed as they run).
 * @return {void}
 */
function printSummary () {
  const counts = { PASS: 0, FAIL: 0, SKIP: 0 }
  for (const r of results) counts[r.status]++
  console.log(`\n${counts.PASS} passed, ${counts.FAIL} failed, ${counts.SKIP} skipped`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
