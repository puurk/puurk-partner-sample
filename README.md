# Puurk Partner Sample

A reference integration that exercises the partner-facing surface of the
Puurk REST API: service-token authentication, client/plan/payment reads,
webhook endpoint management, and signed webhook delivery verification.

Use it two ways:

- **`npm run smoke`** — an end-to-end check that every endpoint a partner
  integration depends on is working as expected (used internally before
  onboarding a new partner, and useful to partners as executable
  documentation).
- **As a starting point** for a real integration: `src/puurk_client.js` is a
  standalone API client, and `src/webhook_server.js` + `src/verify_signature.js`
  are a complete webhook receiver.
- **`npm run storefront`**: an example merchant website (a fictional med spa)
  that lists your organization's services with prices and "as low as $X/mo"
  pricing, and takes Puurk checkout **inline on the merchant's own page** with
  [`@puurk/js`](https://github.com/puurk/puurk-js). There's no redirect to a
  Puurk-hosted page. See [Example storefront](#example-storefront-inline-checkout).

## Quick start

You need a **partner bootstrap credential** (a `client_id` + one-time
`client_secret`) — email **api@puurk.com** with your company/product name, a
technical contact, and one line on what you're integrating, and Puurk will
provision you as a partner and reply with the credential.

The bootstrap credential can't read any data yet: it carries only the
capability to manage your own API clients and to create organizations. Your
first step is provisioning your own private, fully seeded sandbox
organization with it:

```bash
GATEWAY=https://apisandbox.puurk.com

# 1. Exchange the bootstrap credential for a token
TOKEN=$(curl -s -X POST "$GATEWAY/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"<your client_id>","client_secret":"<your client_secret>"}' \
  | jq -r .access_token)

# 2. Provision your organization (one-time). Read the response carefully:
#    the QA user passwords in it are shown ONCE, and the returned `oid`
#    (sandbox-org-<yourslug>) is what you use everywhere below.
curl -s -X POST "$GATEWAY/sandbox/organizations" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"My Test Org"}' | jq .
```

Provisioning grants your credential a scope for the new organization —
tokens minted *before* it don't carry that scope, so the sample always mints
fresh ones. Then:

```bash
npm install
cp .env.example .env   # fill in your client_id, client_secret, and oid
npm run smoke
```

Requires Node.js 20+.

## Environments and base URLs

| Environment | Base URL | Notes |
|---|---|---|
| Production | `https://api.puurk.com` | Live data, live Stripe |
| Sandbox | `https://apisandbox.puurk.com` | Isolated integration environment, per-partner seeded orgs, Stripe test mode |

Set `PUURK_API_BASE_URL` accordingly. All paths below are relative to the
base URL; there is no `/v1` prefix.

### Sandbox

The sandbox is a complete, isolated Puurk environment running the same code
as production — every API service, real webhook deliveries, Stripe test-mode
payments. Nothing you do in it can touch production data or real money.

- **Your own private organization(s).** Provisioning (see Quick start) gives
  you a fully seeded org — clients, offers, contracts, payments, and
  analytics history — that only your credentials can access. No other
  integrator can see or modify your data. Up to 3 orgs per partner.
- **Payments work out of the box**: a Stripe test-mode merchant account is
  created automatically at provisioning (use test card `4242 4242 4242
  4242`).
- **QA users for the web apps**: provisioning returns real logins for the
  provider portal (`https://providersandbox.puurk.com`) so you can see the
  data the sample reads. Passwords are shown only in that one response.
- Self-service reset: `POST /sandbox/reset` with your `oid` restores the
  org's seeded state whenever you want (no automatic resets).
- Interactive API docs (Swagger UI):
  `https://sandboxapi.puurk.com/docs`.

## Authentication

Puurk uses short-lived service tokens:

1. Puurk issues your integration a **client id** and **client secret**.
2. Exchange them for a token: `POST /auth/token` with JSON body
   `{"client_id": "...", "client_secret": "..."}`.
3. The response contains `access_token` (JWT, valid **1 hour**),
   `token_type: "Bearer"`, `expires_in: 3600`, and your granted `scopes`.
4. Send `Authorization: Bearer <access_token>` on every request.
5. Mint a new token before expiry (this client refreshes 60 s early and
   retries once on 401).

Scopes are granted per organization (`oid`) with actions
`read | write | delete | admin`. Your bootstrap credential starts with no
org-scoped access; each organization you provision (sandbox) or create
(production) is granted onto it automatically — mint a fresh token
afterwards to pick the new scope up. A typical read-only reporting
integration needs `read` on your organization. `GET /auth/validate` returns
the token's claims and is a cheap way to confirm credentials are wired up.

## Endpoint coverage

What the smoke test exercises, mapped to integration needs:

| Need | Endpoint(s) |
|---|---|
| Credential exchange | `POST /auth/token`, `GET /auth/validate` |
| Service availability | `GET /health/{auth,leads,contract,offer,payments,webhook,checkout}` |
| Clients | `GET /organizations/{oid}/leads` (paginated), `GET /leads/{leadId}`, `GET /organizations/{oid}/leads/find` |
| Payment plans | `GET /organizations/{oid}/contracts` (paginated), `GET /contracts/{contractId}` |
| Offers | `GET /organizations/{oid}/offers` (paginated), `GET /offers/{offerId}`, `GET /offers/terms` (plan calculator) |
| Payment status | `GET /contracts/{contractId}/payments`, `GET /offers/{offerId}/payments`, `GET /payments/{id}` |
| Webhook management | `GET /webhooks`, `POST /webhooks`, `DELETE /webhooks/{id}` |

Paginated lists return `{ data: [...], pagination: { limit, hasMore,
nextCursor } }`; pass `cursor` and `limit` query params to page.

### Key fields for an operational view

- `Contract.status`: `pending | signed | declined | expired | fulfilled | cancelled | canceled | superseded`
  (handle **both** spellings of cancel(l)ed). 
- `Contract.payoff_balance`, `Contract.total_paid`, `Contract.terms`
  (`down_payment`, `financed_amount`, `term_length`, `monthly_payment`,
  `total_amount`).
- `Payment.status`: `authorizing | authorized | capturing | captured |
  declined | cancelled | canceled | partially_refunded | refunded |
  returned | voided`. `declined`/`returned` are failed installments.
- `Payment.contract_id` links a payment to its plan; `Payment.client_id`
  links it to the client; `Payment.failure_code` / `failure_message`
  explain declines.
- Monetary amounts are **integers in cents**; divide by 100 for display.

There is currently **no scheduled-payments/installment-schedule endpoint**;
derive the expected schedule from `Contract.terms` (monthly payment ×
term length from the signing date) and reconcile against recorded payments.

`npm run report` demonstrates the resulting operational view: every open
plan for the organization with balance, paid-to-date, failed-payment count,
and an ATTENTION flag on plans whose status or payment history warrants a
look before further treatments.

## Webhooks

### Registering

`POST /webhooks` with:

```json
{
  "url": "https://your-host/webhook",
  "events": ["checkout.completed", "payment.succeeded", "payment.failed", "payment.returned", "contract.signed"],
  "secret": "whsec_your_own_secret"
}
```

- The URL must be HTTPS. Limit: **5 active endpoints** per partner.
- `secret` is optional — Puurk generates a `whsec_`-prefixed one if omitted —
  but the full secret is only ever returned in this one response
  (`GET /webhooks` masks it), so supplying your own is easier to manage.
- There is no update endpoint; to change URL or events, `DELETE` and re-`POST`.
- `DELETE /webhooks/{id}` deactivates (soft delete).

`npm run register-webhook` performs this registration using
`WEBHOOK_PUBLIC_URL` + `WEBHOOK_SECRET` from `.env`.

### Event types

| Event | Fires when | `data` fields |
|---|---|---|
| `checkout.completed` | A hosted checkout session completes | `session_id`, `contract_id`, `status`, `amount`, `customer_email` |
| `payment.succeeded` | An installment/payment is captured | `payment_id`, `contract_id`, `amount`, `total_amount`, `status`, `method`, `payment_datetime` |
| `payment.failed` | A payment attempt is declined | `payment_id`, `contract_id`, `amount`, `status`, `failure_code`, `failure_message`, `payment_datetime`, plus the retry fields below |
| `payment.returned` | A settled payment is returned (e.g. ACH return) | same as `payment.failed` |
| `payment.refunded` | A payment is refunded | `payment_id`, `contract_id`, `amount`, `refund_amount`, `total_amount`, `status`, `method`, `payment_datetime` |
| `contract.created` | A payment plan contract is created | shared contract shape (below) |
| `contract.signed` | A client signs a contract — the plan is active | shared contract shape |
| `contract.fulfilled` | A plan is fully paid off | shared contract shape |
| `contract.canceled` | A contract is canceled | shared contract shape |

All `contract.*` events share one `data` shape: `contract_id`, `lead_id`,
`offer_id`, `status`, `title`, `plan_number`, `total_paid`, `payoff_balance`,
`signed_at`, `fulfilled_at`, `created_at`. (`contract.canceled` passes the
raw status through, so expect either `canceled` or `cancelled`.)

`*` subscribes to everything. There are **no missed-payment or delinquency
events today** — detect those by polling `Contract.status` (see the report
script). `payment.failed` covers failed attempts in real time and
`payment.returned` covers post-settlement failures (the usual way an
installment "bounces" after the fact).

`payment.failed` and `payment.returned` also carry five retry fields:
`decline_code`, `retry_category`, `retry_attempt_number`,
`retry_next_attempt_at`, and `retry_stop_reason`. These are additive — the
key is always present — and **all five are `null` on every event today**;
expect `null`, not a missing key, until Puurk's automatic retry system is
enabled.

- `decline_code` — why the attempt was declined (e.g. `insufficient_funds`).
- `retry_category` — the bucket Puurk classified this decline into, which
  determines whether and how it gets retried.
- `retry_attempt_number` — which attempt in the current retry cycle this
  event represents (`1` for the first attempt).
- `retry_next_attempt_at` — ISO-8601 UTC timestamp for the next scheduled
  retry, or `null` if none is scheduled.
- `retry_stop_reason` — why Puurk stopped retrying; present only on the
  cycle's terminal event, `null` otherwise.

Once retries are enabled, expect one `payment.failed` at the first failure
of a retry cycle and one more at the terminal outcome (carrying
`retry_stop_reason`), rather than one event per attempt.

### Delivery format

`POST` to your URL with `Content-Type: application/json`,
`User-Agent: Puurk-Webhooks/1.0`, and body:

```json
{
  "id": "<event id>",
  "type": "payment.succeeded",
  "created_at": "2026-08-06T12:00:00.000Z",
  "data": { ... }
}
```

Respond with a 2xx within **10 seconds**. Anything else (including 4xx) is
retried at 1 m, 5 m, 30 m, 2 h, and 24 h after the initial attempt — 6
attempts total. Deliveries are at-least-once and the same event `id` is
reused across retries (and across multiple endpoints you register), so
dedupe on `id`.

### Signature verification

Every delivery carries:

```
X-Puurk-Signature: t=<unix_seconds>,v1=<hex>
```

where `v1 = hex(HMAC-SHA256(secret, "<t>." + raw_body_bytes))`. Verify
against the **exact raw request bytes** (not a re-serialized parse), compare
with a constant-time comparison, and reject stale timestamps (this sample
allows 300 s of drift). `src/verify_signature.js` is a complete reference
implementation; the receiver in `src/webhook_server.js` shows the wiring
(note `express.raw(...)` to preserve the body bytes).

### Local end-to-end test

```bash
npm run webhook          # terminal 1: start the receiver
npm run send-test-event  # terminal 2: POST a locally signed sample event
npm run tunnel           # optional: expose via ngrok, then register-webhook
```

## Example storefront (inline checkout)

`npm run storefront` serves **Lumière Aesthetics & Wellness**, a realistic demo
med-spa website at http://localhost:4848. Its treatment menu is your
organization's live service catalog. Customers add treatments to a cart and
check out without leaving the site. Puurk's checkout renders inside a drawer on
the page, styled with the site's own colors and font. The checkout covers paying
in full or picking a payment plan, signing the agreement and entering a card.

```
Browser (public/)                  Storefront server (src/storefront_server.js)     Puurk API
GET  /api/services        ───────▶ GET /organizations/{oid}/services           ───▶ catalog
                                   GET /offers/terms (per amount, cached)      ───▶ "as low as"
POST /api/cart/quote               cart priced SERVER-SIDE; terms for the cart
  {items}                 ───────▶ total and for total + each item             ───▶ increments
POST /api/checkout                 cart priced SERVER-SIDE from catalog
  {items, customer}       ───────▶ POST /checkout/sessions (amount, services[])───▶ session
                          ◀─────── { session_id }
Puurk.checkout.mount('#puurk-checkout', session_id, { appearance, payInFull, onComplete, onError })
  └─ the SDK talks to Puurk directly with the session id (no credentials in the browser)
```

The pieces worth copying into a real site:

- **Credentials stay on your server.** The browser only ever receives a
  checkout session id. `GET /config.js` exposes only the SDK environment and
  display settings.
- **Never trust a price from the browser.** The cart sends only service ids
  and quantities. The server prices every line from the catalog it fetched
  from Puurk, caps quantities, and sends Puurk the total as `amount` with the
  lines as `services[]`. The line items are for display and record-keeping;
  `amount` is what drives the plans.
- **"As low as" is quoted, not added up.** Plan lengths change with the
  amount: larger totals unlock longer plans. So the "+$X/mo" a treatment adds
  to the cart is the lowest monthly payment for (cart total + its price) minus
  the cart's own, both from live `GET /offers/terms`. Adding something can
  even *lower* the monthly minimum, and the cards say so. Terms are cached per
  amount.
- **Match the checkout to your brand.** `mount()` takes an `appearance`
  (colors, font, radius, web fonts) that styles the embedded checkout,
  including Stripe's card fields. The embedded checkout doesn't repeat your
  business or customer name, because your page already shows that context.
- **A down payment up front.** Payment plans collect 10% of the cart today
  (`STOREFRONT_DOWN_PAYMENT_PERCENT`, 0 to finance it all). The server sends
  it as the session's `down_payment` and passes the same amount to
  `GET /offers/terms`, so the "as low as" prices match the plans offered at
  checkout.
- **Pay in full is your call.** The embedded checkout offers paying in full
  alongside payment plans. If you take full payments through another channel,
  set `STOREFRONT_PAY_IN_FULL=false`; the storefront passes `payInFull: false`
  to `mount()`, so only payment plans are offered. A pay-in-full checkout
  completes with `contract_id: null`, because there's no payment plan.
- **Idempotent session creation.** Each checkout attempt gets an attempt id,
  and the server derives the `Idempotency-Key` from it plus the cart contents.
  A double-click replays the same session instead of creating two, while a
  changed cart gets a fresh one.
- **Sessions expire after 30 minutes.** The drawer offers a one-click
  "Start again" that creates a fresh session.
- **An error isn't proof of failure.** If the embedded checkout reports an
  error, the browser asks the server (`GET /api/checkout/{id}/status`, backed by
  the partner `GET /checkout/sessions/{id}`) for the session's real status for
  up to about a minute. If the session completed, the drawer shows the
  confirmation. "Start again" is offered only when the session didn't
  complete, so a customer is never invited to pay twice.
- **The online menu is curated.** A real catalog can hold hundreds of items
  (add-ons, per-unit pricing, internal entries). Set `STOREFRONT_SERVICE_IDS`
  to choose exactly what's sold online. Without it, the server takes a varied
  selection: one item per category in turn, within a price range, skipping
  add-ons. Terms are only looked up for items that are on sale.
- **Merchant presentation is yours.** Puurk owns names and prices;
  `public/service_presentation.js` maps each service to a category tab, photo
  and marketing copy on the merchant side.

Run it:

```bash
npm install
cp .env.example .env    # credential + provisioned sandbox oid (see Quick start)
npm run storefront      # http://localhost:4848
```

The credential needs `services:read`, `terms:read` and `checkout:write` on the
organization; a partner credential has all three on the orgs it provisions.
Without `terms:read` the site still works, just without "as low as" pricing.
In the sandbox, pay with test card `4242 4242 4242 4242` (any future expiry,
any CVC). A completed checkout creates the client and either a payment plan
with scheduled payments, or a single payment if the client paid in full. You
can see them in the provider portal
(`https://providersandbox.puurk.com`). It also fires a `checkout.completed`
webhook if you've registered one (see [Webhooks](#webhooks)).

### The @puurk/js SDK

`@puurk/js` isn't on npm or the `js.puurk.com` CDN yet, so a built copy is
vendored at `public/vendor/puurk.js`. Its first line records the version and
commit. To refresh it from a local checkout of `puurk-js`:

```bash
npm run vendor-sdk                 # builds ../puurk-js
npm run vendor-sdk -- <path>       # or another checkout
```

Once the CDN is live, set `PUURK_JS_URL=https://js.puurk.com/v1/puurk.js` and
skip vendoring. `PUURK_ENVIRONMENT` (default `sandbox`) tells the SDK which
Puurk environment to talk to, and must match `PUURK_API_BASE_URL`.

Photos in `public/images/` are from [Unsplash](https://unsplash.com), free to
use under the Unsplash License (see `public/images/CREDITS.md`). Lumière is a
fictional business.

## Rate limits and restrictions

- Token lifetime 3600 s; `POST /auth/token` is rate limited (HTTP 429) — mint
  once per hour, not per request.
- Webhook delivery timeout 10 s; 5 active webhook endpoints max.
- `GET /offers?ids=` accepts at most 500 ids.
- API clients can additionally be restricted by IP allowlist.

## Scripts

| Script | Purpose |
|---|---|
| `npm run smoke` | Exercise every endpoint above; PASS/FAIL report, exit 1 on failure |
| `npm run report` | Operational "plans needing attention" view for `PUURK_OID` |
| `npm run webhook` | Start the signed-webhook receiver |
| `npm run register-webhook` | Register `WEBHOOK_PUBLIC_URL` with Puurk |
| `npm run send-test-event` | POST a locally signed event to the receiver |
| `npm run tunnel` | ngrok tunnel for local webhook testing |
| `npm run storefront` | Example med-spa website with inline Puurk checkout (http://localhost:4848) |
| `npm run storefront:dev` | Same, restarting on server code changes |
| `npm run vendor-sdk` | Build `@puurk/js` from `../puurk-js` into `public/vendor/puurk.js` |
