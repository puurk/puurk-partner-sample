/**
 * Puurk's own public deployment of the static storefront at
 * https://demosite.puurk.com, against the Puurk sandbox (Stripe test mode,
 * no real emails or texts). Integrators can ignore this file: edit
 * static/config.js instead.
 *
 * Built with `npm run build:static -- --config static/config.demosite.js
 * --noindex` and deployed by .github/workflows/deploy-demosite.yml, which
 * skips the deploy while the ids below are still placeholders.
 */
window.STOREFRONT_CONFIG = {
  mode: 'static',
  environment: 'sandbox',
  // The sandbox demo organization's publishable client, issued for
  // https://demosite.puurk.com only.
  clientId: 'pk_sandbox_demosite',
  oid: 'sandbox-org-demosite',
  puurkJsUrl: '/vendor/puurk.js',
  payInFull: true,
  // Shows the "demo site, use test card 4242" notice above the page.
  demoNotice: true,
  serviceIds: [],
  maxServices: 12,
  maxPackages: 4
}
