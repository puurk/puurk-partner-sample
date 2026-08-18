/**
 * Operational report: the "does this client's Puurk account need attention?"
 * view a partner system would maintain. Lists every contract for the
 * organization with balance and status, flagging plans whose status or
 * recent payment history warrants a look before further treatments.
 *
 * Usage: npm run report   (requires credentials and PUURK_OID)
 */

const { config, requireCredentials } = require('./config')
const { PuurkClient } = require('./puurk_client')

// Contract statuses that mean the plan needs attention. Both spellings of
// cancel(l)ed appear in the API.
const ATTENTION_STATUSES = new Set(['overdue', 'delinquent', 'collections'])
const CLOSED_STATUSES = new Set(['fulfilled', 'cancelled', 'canceled', 'superseded', 'declined', 'expired'])
const FAILED_PAYMENT_STATUSES = new Set(['declined', 'returned'])

/**
 * Formats an integer cent amount as dollars.
 * @param {number|null|undefined} cents Amount in cents.
 * @return {string} '$x.xx' or '-' when absent.
 */
function dollars (cents) {
  if (cents === null || cents === undefined) return '-'
  return `$${(cents / 100).toFixed(2)}`
}

async function main () {
  requireCredentials()
  if (!config.oid) {
    console.error('Set PUURK_OID in .env first')
    process.exit(1)
  }

  const client = new PuurkClient(config)
  console.log(`Operational view for organization ${config.oid} (${config.baseUrl})\n`)

  const contracts = []
  let cursor
  do {
    const page = await client.listOrgContracts(config.oid, { limit: 100, cursor })
    contracts.push(...(page.data ?? []))
    cursor = page.pagination?.hasMore ? page.pagination.nextCursor : null
  } while (cursor)
  const open = contracts.filter(c => !CLOSED_STATUSES.has(c.status))
  console.log(`${contracts.length} contract(s) total, ${open.length} open\n`)

  const rows = []
  for (const contract of open) {
    const payments = await client.listContractPayments(contract.id)
    const failed = payments.filter(p => FAILED_PAYMENT_STATUSES.has(p.status))
    const lastFailed = failed
      .map(p => p.payment_datetime)
      .filter(Boolean)
      .sort()
      .at(-1)

    const needsAttention = ATTENTION_STATUSES.has(contract.status) || failed.length > 0
    rows.push({
      client: contract.lead_name ?? contract.lead_id ?? '-',
      plan: contract.title ?? contract.id,
      status: contract.status,
      paid: dollars(contract.total_paid),
      balance: dollars(contract.payoff_balance),
      monthly: dollars(contract.terms?.monthly_payment),
      failedPayments: failed.length,
      lastFailed: lastFailed ? lastFailed.slice(0, 10) : '-',
      flag: needsAttention ? 'ATTENTION' : ''
    })
  }

  rows.sort((a, b) => (b.flag ? 1 : 0) - (a.flag ? 1 : 0))
  if (rows.length === 0) {
    console.log('No open contracts.')
    return
  }
  console.table(rows)

  const flagged = rows.filter(r => r.flag)
  console.log(flagged.length > 0
    ? `${flagged.length} plan(s) need attention before further treatments.`
    : 'All open plans are in good standing.')
}

main().catch(err => {
  console.error(err.message)
  if (err.body) console.error(JSON.stringify(err.body, null, 2))
  process.exit(1)
})
