import "server-only"

/**
 * Server-only application configuration.
 *
 * K3s injects these values into the running pod from ConfigMaps and Secrets.
 * They are read at runtime and are never included in browser JavaScript.
 * The fallback values are retained for local development and tests.
 */

// AWS Cognito
export const COGNITO_REGION = process.env.COGNITO_REGION
export const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID

// Internal backend services
export const PROFILE_SERVICE_URL = process.env.USER_MANAGEMENT_PROFILE_SERVICE_BASE_URL
export const AWS_INTEGRATION_SERVICE_URL = process.env.AWS_INTEGRATION_SERVICE_BASE_URL
export const AWS_INTEGRATION_INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET
export const ORDER_SERVICE_URL = process.env.ORDER_MANAGEMENT_SERVICE_BASE_URL
export const DRIVER_MANAGEMENT_SERVICE_BASE_URL = process.env.DRIVER_MANAGEMENT_SERVICE_BASE_URL
export const ORDER_FULFILMENT_SERVICE_URL = process.env.ORDER_FULFILMENT_SERVICE_URL
export const PRICING_PAYMENT_SERVICE_URL = process.env.PAYMENT_PRICING_SERVICE_BASE_URL
export const BILLING_MANAGEMENT_SERVICE_URL = process.env.BILLING_SERVICE_BASE_URL
export const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_BASE_URL

export const getEndpointUrl = (baseUrl: string, endpoint: string): string => `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`
