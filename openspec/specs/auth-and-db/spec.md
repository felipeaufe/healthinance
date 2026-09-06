# auth-and-db Specification

## Purpose
Manages database persistence with Drizzle ORM on PostgreSQL and secures applications with Supabase Authentication.

## Requirements

### Requirement: Database schema definitions
The database layer SHALL define relational schemas in Drizzle ORM for users, Pluggy items, accounts, and transactions.

#### Scenario: Schema validation
- **WHEN** Drizzle migrations are generated or executed
- **THEN** PostgreSQL tables MUST create foreign key references linking items, accounts, and transactions back to the authenticated user ID.

### Requirement: Backend JWT authentication guard
The Fastify backend API SHALL validate Supabase JWT access tokens on protected endpoints.

#### Scenario: Request with valid Supabase token
- **WHEN** a client sends an HTTP request with `Authorization: Bearer <valid_token>`
- **THEN** the server MUST decode the user identity and attach the user ID to the request context.

#### Scenario: Request with missing or invalid token
- **WHEN** a client sends an HTTP request without a bearer token or with an expired token to a protected endpoint
- **THEN** the server MUST respond with HTTP 401 Unauthorized status.
