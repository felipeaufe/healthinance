## Purpose

Provides user authentication interfaces (login, register, forgot-password), route guards, and authenticated API client integration using Supabase Auth.

## ADDED Requirements

### Requirement: User authentication forms
The web application SHALL provide forms for email and password authentication, registration, and password recovery.

#### Scenario: Successful login
- **WHEN** the user submits valid email and password credentials on the `/login` page
- **THEN** the system MUST authenticate the user with Supabase Auth, persist session cookies, and redirect to `/dashboard`.

#### Scenario: Invalid login credentials
- **WHEN** the user submits incorrect credentials on the `/login` page
- **THEN** the system MUST display an error message and keep the user on the login screen.

#### Scenario: User registration
- **WHEN** a new user provides a valid email and password on `/register`
- **THEN** the system MUST create the account via Supabase Auth and display confirmation feedback.

### Requirement: Route protection and middleware redirection
The application SHALL protect private routes from unauthenticated access and redirect authenticated users away from public auth pages.

#### Scenario: Unauthenticated access to protected route
- **WHEN** an unauthenticated user attempts to navigate to `/dashboard`
- **THEN** the middleware MUST redirect the user to `/login`.

#### Scenario: Authenticated access to auth route
- **WHEN** an authenticated user attempts to navigate to `/login` or `/register`
- **THEN** the middleware MUST redirect the user to `/dashboard`.

### Requirement: User sign out
The application SHALL allow authenticated users to terminate their session.

#### Scenario: Clicking sign out button
- **WHEN** an authenticated user clicks the "Sair" button in the dashboard
- **THEN** the system MUST clear Supabase auth cookies and redirect the user to `/login`.

### Requirement: Authenticated API requests
The frontend API client SHALL attach the active Supabase JWT access token to requests directed to the Fastify API.

#### Scenario: Requesting protected backend endpoints
- **WHEN** an authenticated frontend component makes an HTTP request to the backend API
- **THEN** the client MUST include the header `Authorization: Bearer <access_token>`.
