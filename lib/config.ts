/**
 * Configuration file for backend service URLs and other environment variables.
 * These values can be overridden by setting environment variables in .env or .env.local files.
 */

// Auth Service
export const AUTH_MICROSERVICE_URL = process.env.AUTH_MICROSERVICE_URL || 'http://localhost/usermanagement/auth';
export const AUTH_API_KEY = process.env.AUTH_API_KEY || '';

// Cognito
export const COGNITO_REGION = process.env.COGNITO_REGION || 'ca-central-1';
export const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'ca-central-1_YTz92IljQ';
export const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '1vs75mtp26ad59gsrlpgnf6q36';

// Profile Service
export const PROFILE_SERVICE_URL = process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || 'http://localhost/usermanagement';

// AWS Integration Service
export const AWS_INTEGRATION_SERVICE_URL =
  process.env.NEXT_PUBLIC_AWS_INTEGRATION_SERVICE_URL ||
  'http://localhost:8086/aws-integration';

// Order Service
export const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost/ordermanagement';

// Order Fulfilment Service
export const ORDER_FULFILMENT_SERVICE_URL =
  process.env.NEXT_PUBLIC_ORDER_FULFILMENT_SERVICE_URL ||
  'http://localhost/orderfulfilment';

// Payment / Pricing Service
export const PRICING_PAYMENT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRICING_PAYMENT_SERVICE_URL ||
  'http://localhost/pricingpayment';

// Billing Management Service
export const BILLING_MANAGEMENT_SERVICE_URL =
  process.env.BILLING_MANAGEMENT_SERVICE_URL ||
  process.env.NEXT_PUBLIC_BILLING_MANAGEMENT_SERVICE_URL ||
  'http://localhost/billingmanagement';


export const MONERIS_CHECKOUT_SCRIPT_SRC =
  process.env.NEXT_PUBLIC_MONERIS_CHECKOUT_SCRIPT_SRC ||
  "https://gatewayt.moneris.com/chkt/js/chkt_v1.00.js";

export const MONERIS_CHECKOUT_MODE =
  process.env.NEXT_PUBLIC_MONERIS_CHECKOUT_MODE || "qa";

// Google Maps API
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyA3wSq5PrN2evVDM5MiRKPa4ZS69taWS8E';

/**
 * Helper function to get the full URL for a specific endpoint
 */
export const getEndpointUrl = (baseUrl: string, endpoint: string): string => {
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const MONERIS_API_CONFIG = {
  baseUrl: "http://localhost/pricingpayment/moneris/"
};
