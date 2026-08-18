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

- `Contract.status`: `pending | signed | declined | expired | fulfilled |
  overdue | delinquent | collections | cancelled | canceled | superseded`
  (handle **both** spellings of cancel(l)ed). `overdue`, `delinquent`, and
  `collections` are the "account needs attention" states.
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
| `payment.failed` | A payment attempt is declined | `payment_id`, `contract_id`, `amount`, `status`, `failure_code`, `failure_message`, `payment_datetime` |
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
