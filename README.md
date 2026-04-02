# MapleExpress Environment Variables Configuration

This document provides information about the environment variables used in the MapleExpress application, where they are used in the code, and how to configure them.

## Node.js Version

The project is tested with **Node.js 20**. Using newer versions such as Node 24 can cause build errors (for example, `TypeError: Cannot read properties of undefined (reading 'length')`). Ensure your local environment uses Node 20 when running development or build commands.

## Environment Variables Overview

The application uses several environment variables for configuration. These are defined in `lib/config.ts` and can be overridden by setting them in `.env` or `.env.local` files.

## Signup & Email Verification Flow (Cognito)

The current signup flow uses AWS Cognito confirmation codes:

1. Sign up with email + password.
2. Cognito sends a numeric confirmation code to the user's email.
3. Enter the code in the "Verify Your Email" UI to confirm the account.
4. After confirmation, return to the login screen and sign in normally.
5. If needed, resend the confirmation code from the same screen.

## Logout Behavior (Cognito JWT)

- Logout is handled entirely in the app: access/refresh cookies are cleared and local auth state is reset.
- No legacy auth microservice logout endpoint is called.

## Forgot Password Flow (Cognito Code Reset)

1. Open "Forgot Password" and enter your email to request a reset code.
2. Enter the confirmation code and a new password (with confirmation).
3. Return to login and sign in with the new password.

### Auth Service
- **AUTH_MICROSERVICE_URL**: URL for the authentication microservice
  - Default: `http://localhost:30080/usermanagement/auth`
  - Used in: Authentication-related API calls
- **AUTH_REFRESH_URL**: URL for refreshing authentication tokens
  - Default: `${AUTH_MICROSERVICE_URL}/refresh`
  - Used in: Token refresh operations

### Cognito
- **COGNITO_REGION**: AWS region for the Cognito User Pool
  - Default: `''` (empty string)
  - Used in: Cognito auth API routes (`app/api/auth/login/route.ts`, `app/api/auth/signup/route.ts`)
- **COGNITO_CLIENT_ID**: Cognito App Client ID
  - Default: `''` (empty string)
  - Used in: Cognito auth API routes (`app/api/auth/login/route.ts`, `app/api/auth/signup/route.ts`)

### Profile Service
- **NEXT_PUBLIC_PROFILE_SERVICE_URL**: URL for the profile management service
  - Default: `http://localhost:30081/usermanagement`
  - Used in:
    - Profile API routes (`app/api/profile/address/route.ts`)
    - Individual profile management (`app/api/profile/individual/route.ts`)
    - Organization profile management (`app/api/profile/organization/route.ts`)
    - Profile update operations

### Order Service
- **NEXT_PUBLIC_ORDER_SERVICE_URL**: URL for the order management service
  - Default: `http://localhost:30082/ordermanagement`
  - Used in: Order-related operations

### Payment Service
- **NEXT_PUBLIC_PRICING_PAYMENT_SERVICE_URL**: URL for the pricing and payment service
  - Default: `http://localhost:30083/paymentservice`
  - Used in: Payment processing and pricing calculations

### Google Maps API
- **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY**: API key for Google Maps services
  - Default: `''` (empty string)
  - Used in:
    - Address autocompletion component (`components/address-autocomplete.tsx`)
    - Exposed to client-side via Next.js configuration (`v0-user-next.config.mjs`)

## Google Maps API Key Configuration

The Google Maps API key is used for address autocompletion functionality in the application. It's important to configure this properly for the address autocompletion feature to work correctly.

### How to Obtain a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to APIs & Services > Credentials
4. Click "Create Credentials" and select "API Key"
5. Restrict the API key to only the services you need (Places API, Maps JavaScript API)
6. Enable billing for your Google Cloud project (required for API usage)

### Required Google APIs

For address autocompletion to work properly, you need to enable:
- Places API
- Maps JavaScript API

### Configuration Steps

1. Add your Google Maps API key to your `.env.local` file:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. The key is automatically exposed to the client-side through Next.js configuration in `v0-user-next.config.mjs`

3. The address autocompletion component uses this key to load the Google Maps Places API and initialize the autocomplete functionality

## How to Configure Environment Variables

1. Create a `.env.local` file in the root directory of the project
2. Add your environment variables in the format `KEY=VALUE`
3. For local development, you can use the default values provided in `lib/config.ts`
4. For production, make sure to set all required environment variables with appropriate values

Example `.env.local` file:
```
AUTH_MICROSERVICE_URL=https://api.example.com/auth
COGNITO_REGION=ca-central-1
COGNITO_CLIENT_ID=exampleclientid
NEXT_PUBLIC_PROFILE_SERVICE_URL=https://api.example.com/profiles
NEXT_PUBLIC_ORDER_SERVICE_URL=https://api.example.com/orders
NEXT_PUBLIC_PRICING_PAYMENT_SERVICE_URL=https://api.example.com/payments
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Local Verification Testing Checklist

1. Sign up with a new email address.
2. Check the email inbox for the Cognito confirmation code.
3. Enter the code in the "Verify Your Email" UI and confirm.
4. Verify that the UI returns to login and that you can sign in.
5. Use "Resend Code" to verify the resend flow.
6. Use "Forgot Password" to request a reset code.
7. Confirm the code with a new password and sign in again.

## Environment Variables in Next.js

Next.js has specific rules for environment variables:
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Other variables are only available on the server side
- The `v0-user-next.config.mjs` file explicitly exposes the Google Maps API key to the client side

## Best Practices

1. Never commit `.env` or `.env.local` files to version control
2. Use appropriate default values in `lib/config.ts` for development
3. Always access environment variables through the exports in `lib/config.ts` rather than directly using `process.env`
4. Ensure API keys have appropriate restrictions (domain, IP, etc.) for security

---

## MapleXpress Auth Architecture (Centralized, Production Standard)

> This section is the source of truth for how authentication must work in this repository.
> Any new API code MUST follow this model.

### 1) Overall design

MapleXpress FE uses AWS Cognito-issued JWTs with a **cookie-backed session model**.

- Cognito provides access/refresh/id tokens through the login and refresh flows.
- Tokens are stored in **httpOnly cookies** (canonical source).
- Server-side code is responsible for token forwarding, refresh, retry, and cookie lifecycle.
- Client-side code must rely on shared wrappers and never handle raw tokens.

Why this is mandatory:
- The project historically had mixed token paths (cookies + local/session storage + manual headers), which caused stale-token bugs and intermittent unauthorized behavior.
- Centralization removes race conditions, inconsistent refresh behavior, and hard-to-debug “logged in but unauthorized” states.

### 2) Canonical token flow

#### Login
1. Client calls `/api/auth/login`.
2. Route performs Cognito auth.
3. Route sets httpOnly cookies via centralized helpers (`applyAuthCookies`).
4. Client stores only non-sensitive user/session metadata (never access token).

#### Authenticated request flow
1. Client uses `apiFetch` (not plain `fetch`) for authenticated internal API calls.
2. Route handlers / server services use centralized server auth helpers.
3. Access token is attached centrally.

#### 401 refresh flow
1. First authenticated request returns 401.
2. Centralized refresh runs using refresh token.
3. New cookies are persisted.
4. Original request is retried once with fresh access token.
5. If retry fails with 401, cookies/session are cleared and error is surfaced.

#### Retry policy
- Exactly one retry after refresh.
- No infinite loops.
- In-flight refresh is deduplicated to avoid refresh races.

#### Logout cleanup
- `/api/auth/logout` clears all auth cookies via centralized helper.
- Client-side session metadata and any legacy token artifacts are cleared.

#### Startup/proactive refresh
- App startup attempts session refresh through centralized path.
- Legacy token artifacts are cleaned during bootstrap.

### 3) Server-side authenticated API pattern

Use one of these centralized paths:

- **Route-handler proxy pattern**: `proxyWithAuthRetry(request, options)` in `lib/authenticated-proxy.ts`.
  - Use in `app/api/*` routes that proxy to backend services.
  - Handles token retrieval, refresh, retry-once, and cookie updates/cleanup.

- **Server utility pattern**: `authenticatedServerFetch(url, init, options)` in `lib/server-auth.ts`.
  - Use in `lib/*` server utilities called from server components/routes.
  - Handles cookie token retrieval, 401 refresh/retry-once, and best-effort cookie persistence/cleanup.

Never do this manually in server code:
- read auth cookies directly for token forwarding,
- construct `Authorization` headers manually,
- implement custom refresh logic,
- duplicate retry logic.

### 4) Client-side authenticated API pattern

For authenticated internal FE calls (`/api/...`), always use:
- `apiFetch` from `lib/client-api.ts`.

`apiFetch` guarantees:
- `credentials: include`,
- centralized 401 handling,
- refresh + retry-once,
- refresh deduplication,
- legacy token cleanup.

Never do this manually in client code:
- attach bearer tokens in headers,
- read/write access tokens from storage,
- call refresh endpoints with custom logic,
- create duplicate wrappers around auth behavior.

### 5) Forbidden anti-patterns

The following are explicitly forbidden:

1. `localStorage` / `sessionStorage` access token storage.
2. Manual `Authorization: Bearer ...` construction outside centralized auth helpers.
3. Route handlers that bypass `proxyWithAuthRetry` (for authenticated backend proxy calls).
4. Server utilities that bypass `authenticatedServerFetch` (for authenticated backend calls).
5. Custom per-file refresh implementations.
6. Parallel/duplicate wrappers that diverge from centralized behavior.
7. Ad-hoc cookie token parsing in feature code.

### 6) How to add new API calls correctly

#### A) New authenticated server-side route (`app/api/...`)
1. Validate request input.
2. Call `proxyWithAuthRetry(request, { method, url, body?, includeIdToken?, contentTypeJson? })`.
3. Return proxied response payload/status.
4. Do not parse cookies/tokens directly.
5. Do not manually attach Authorization.

#### B) New authenticated server utility (`lib/...`, server-only)
1. Call `authenticatedServerFetch(url, init, { includeIdToken? })`.
2. Handle `null` as unauthorized.
3. Keep endpoint path/payload/response shaping local to the utility.
4. Do not manually read cookies/tokens.

#### C) New authenticated client call
1. Use `apiFetch('/api/...', init)`.
2. Keep payload/response mapping in service function.
3. Do not add auth headers manually.
4. Do not use direct refresh logic.

#### D) New unauthenticated call
- Use normal `fetch` (or a separate non-auth wrapper) only when endpoint is explicitly public/auth bootstrap flow.
- Do not route public calls through auth retry wrappers unless endpoint is actually authenticated.

#### E) Calls requiring id token
- Route handler proxy: set `includeIdToken: true`.
- Server utility fetch: set `{ includeIdToken: true }`.
- Never pass id token manually from feature code.

### 7) Debugging guidance

When debugging unauthorized behavior:

1. Confirm call path:
   - Client auth call should use `apiFetch`.
   - Route proxy should use `proxyWithAuthRetry`.
   - Server utility should use `authenticatedServerFetch`.

2. Check expected sequence:
   - first request 401 -> refresh -> retry once.

3. If repeated 401:
   - refresh token may be expired/invalid,
   - centralized helpers should clear auth cookies,
   - client should transition to signed-out behavior.

4. Check logs in:
   - route handlers using proxy helper,
   - auth refresh route,
   - server-auth helper paths.

5. Common failure modes:
   - using plain `fetch` for authenticated endpoint,
   - bypassing centralized helper in a new file,
   - introducing manual bearer headers,
   - stale legacy code reading token-like values from storage.

### 8) Migration / historical context

This repository previously had stale-token-prone mixed auth paths (manual headers, direct cookie/token reads, legacy storage artifacts, fragmented refresh behavior).

The current model is intentionally centralized and strict.

Future changes MUST preserve this standard and must not reintroduce legacy token handling patterns.
