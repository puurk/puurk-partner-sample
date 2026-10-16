/**
 * Webhook receiver: verifies X-Puurk-Signature on each delivery, dedupes on
 * event id, and logs the event. Run behind an HTTPS tunnel (e.g. ngrok) and
 * register the public URL with `npm run register-webhook`.
 */

const { config } = require('./config')
const { createWebhookApp } = require('./webhook_app')

const app = createWebhookApp(config)

app.listen(config.webhookPort, () => {
  console.log(`Webhook receiver listening on http://localhost:${config.webhookPort}${config.webhookPath}`)
  if (!config.webhookSecret) {
    console.warn('WEBHOOK_SECRET is not set — all deliveries will be rejected with 401')
  }
})
