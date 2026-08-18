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
  signatureToleranceSeconds: Number(process.env.SIGNATURE_TOLERANCE_SECONDS || 300)
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
