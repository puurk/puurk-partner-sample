/**
 * Configuration for the static (serverless) storefront. This is the only
 * file to edit: the page in public/ reads it, and nothing else runs on a
 * server. Everything here is safe to publish.
 *
 * clientId is a publishable client id, not a secret: Puurk only accepts it
 * from the origins it was issued for, for this one organization, and it can
 * only read the catalog and prices and start checkouts from catalog items.
 * Ask Puurk (api@puurk.com) to issue one, listing every origin that will
 * serve this site (e.g. https://www.example.com, http://localhost:4849).
 */
window.STOREFRONT_CONFIG = {
  mode: 'static',
  // staging | demo | sandbox | production
  environment: 'sandbox',
  clientId: 'your-publishable-client-id',
  oid: 'sandbox-org-yourslug',
  // Where the page loads @puurk/js from. The vendored build, or
  // https://js.puurk.com/v1/puurk.js once the CDN is live.
  puurkJsUrl: '/vendor/puurk.js',
  // Offer "Pay in full" in the checkout and the price widgets.
  payInFull: true,
  // Optional curated menu: service ids in display order. Empty shows the
  // catalog, up to maxServices treatments and maxPackages packages.
  serviceIds: [],
  maxServices: 12,
  maxPackages: 4
}
