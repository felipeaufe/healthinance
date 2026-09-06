# pluggy-integration Specification

## Purpose
Integrates the backend securely with Pluggy API for Open Finance data aggregation and webhook synchronization.

## Requirements

### Requirement: Connect token generation
The backend API SHALL generate short-lived Connect Tokens via the Pluggy SDK without exposing client credentials to frontend clients.

#### Scenario: Authenticated user requests connect token
- **WHEN** an authenticated user calls `POST /api/pluggy/connect-token`
- **THEN** the API MUST request a connect token from Pluggy using server-side credentials and return the token string to the client.

### Requirement: Pluggy webhook ingestion
The backend API SHALL receive and process Pluggy webhook notifications for item events and transaction synchronization.

#### Scenario: Item updated webhook received
- **WHEN** Pluggy sends a `POST /api/webhooks/pluggy` notification containing an `itemId` and event type `item/updated`
- **THEN** the API MUST acknowledge the webhook with HTTP 200 and trigger a background synchronization of accounts and transactions for that item.
