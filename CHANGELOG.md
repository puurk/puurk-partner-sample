# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [v0.3.0]

### Added

- PUU-2802: Example storefront (`npm run storefront`). A realistic demo
  med-spa website that lists the organization's live service catalog with
  prices and "as low as $X/mo" Puurk pricing, and takes checkout inline on
  the merchant's own page with `@puurk/js` (`Puurk.checkout.mount`), with no
  redirect to a Puurk-hosted page. The server keeps the API credential,
  prices sessions from the catalog (never from the browser), and creates
  sessions idempotently. Ships with a vendored `@puurk/js` build
  (`npm run vendor-sdk` refreshes it), a responsive design, and a confirmation page.
- PUU-2802: When the embedded checkout reports an error, the storefront checks
  the session's real status on the server (partner
  `GET /checkout/sessions/{id}`) before offering "Start again", and shows
  the confirmation if the checkout actually completed. A confirm can finish
  in Puurk after the browser sees a failure (for example an API gateway
  timeout), and restarting would charge the customer twice.
- PUU-2824: Shopping cart for the storefront. Clients add several treatments
  and packages, adjust quantities, and check out once. The server prices the
  whole cart from the catalog, caps quantities, and creates one Puurk session
  for the total with the items as line items. A new `POST /api/cart/quote`
  endpoint returns the cart's "as low as" plus, for every treatment, how much
  adding it changes the cart's lowest monthly payment. Cards show this as
  "Add for +$X/mo", quoted from live terms because plan lengths change with
  the amount.
- PUU-2824: The embedded checkout is styled with Lumière's brand through the
  `@puurk/js` `appearance` option, and offers pay in full alongside payment
  plans. `STOREFRONT_PAY_IN_FULL=false` passes `payInFull: false` for
  integrators who take full payments elsewhere.
- PUU-2824: Payment plans take a 10% down payment by default, so something
  is paid up front. The storefront sends it as the session's `down_payment`
  and uses it for every "as low as" quote, and the cart shows it as
  "$X today, then as low as $Y/mo". `STOREFRONT_DOWN_PAYMENT_PERCENT`
  changes it (0 finances the whole amount).
- `PuurkClient` methods for the service catalog and checkout sessions.

## [v0.2.1]

### Security

- PUU-2784: Resolve Vanta-reported npm vulnerabilities via `npm audit fix`
  (lockfile only): `qs` 6.15.3 -> 6.16.0 (GHSA-x5fp-wj9c-mxmx,
  GHSA-4mjr-xmp4-gh2g), `express` 4.22.2 -> 4.22.3, `body-parser`
  1.20.6 -> 1.20.8, and `proxy-addr` 2.0.7 -> 2.0.8 (GHSA-jqcg-44mw-7w3h).
  `npm audit` now reports 0 vulnerabilities.

## [v0.2.0]

### Changed

- Getting started now walks through the partner provisioning flow: request a
  bootstrap credential (api@puurk.com), exchange it via `POST /auth/token`,
  provision your own private seeded sandbox organization with a one-time
  `POST /sandbox/organizations` (includes QA portal users and an automated
  Stripe test merchant), then run `npm run smoke` against your own `oid`.
  The Authentication section explains that org scopes are granted onto the
  credential as organizations are provisioned or created and are picked up
  at the next token mint.

## [v0.1.0]

### Added

- Sample partner integration exercising the Puurk REST API: service-token
  auth client, endpoint smoke test with PASS/FAIL report, operational
  "plans needing attention" report, webhook receiver with X-Puurk-Signature
  verification, webhook registration and signed test-event scripts.
- Documented and covered all nine webhook event types:
  `checkout.completed`, `payment.succeeded`/`failed`/`returned`/`refunded`,
  and `contract.created`/`signed`/`fulfilled`/`canceled`.
- Smoke test streams results live and matches the deployed gateway
  parameter/response shapes (free-text client search, paginated contracts
  and offers, authenticated plan-terms calculator).

### Changed

- Default environment is the sandbox: base URL defaults to
  `https://apisandbox.puurk.com` and the README documents the sandbox
  (private seeded orgs, self-service reset, Swagger UI).
