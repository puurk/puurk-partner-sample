# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
