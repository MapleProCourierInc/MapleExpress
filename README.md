# MapleExpress Environment Variables Configuration

This document provides information about the environment variables used in the MapleExpress application, where they are used in the code, and how to configure them.

## Node.js Version

The project is tested with **Node.js 20**. Using newer versions such as Node 24 can cause build errors (for example, `TypeError: Cannot read properties of undefined (reading 'length')`). Ensure your local environment uses Node 20 when running development or build commands.

## Environment Variables Overview

The application uses several environment variables for configuration. These are defined in `lib/config.ts` and can be overridden by setting them in `.env` or `.env.local` files.

### Auth Service
- **AUTH_MICROSERVICE_URL**: URL for the authentication microservice
  - Default: `http://localhost:30080/usermanagement/auth`
  - Used in: Authentication-related API calls
- **AUTH_REFRESH_URL**: URL for refreshing authentication tokens
  - Default: `${AUTH_MICROSERVICE_URL}/refresh`
  - Used in: Token refresh operations
- **AUTH_API_KEY**: API key for authentication service
  - Default: `''` (empty string)
  - Used in: Authentication API calls that require an API key

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
AUTH_API_KEY=your_auth_api_key
NEXT_PUBLIC_PROFILE_SERVICE_URL=https://api.example.com/profiles
NEXT_PUBLIC_ORDER_SERVICE_URL=https://api.example.com/orders
NEXT_PUBLIC_PRICING_PAYMENT_SERVICE_URL=https://api.example.com/payments
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

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