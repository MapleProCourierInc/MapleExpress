/**
 * Configuration file for backend service URLs and other environment variables.
 * These values can be overridden by setting environment variables in .env or .env.local files.
 */

// Auth Service
export const AUTH_MICROSERVICE_URL = process.env.AUTH_MICROSERVICE_URL || 'https://testapi.maplexpress.ca/usermanagement/auth';
export const AUTH_REFRESH_URL = process.env.AUTH_REFRESH_URL || `${AUTH_MICROSERVICE_URL}/refresh`;
export const AUTH_API_KEY = process.env.AUTH_API_KEY || '';

// Profile Service
export const PROFILE_SERVICE_URL = process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || 'https://testapi.maplexpress.ca/usermanagement';

// Order Service
export const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'https://testapi.maplexpress.ca/ordermanagement';

// Order Fulfilment Service
export const ORDER_FULFILMENT_SERVICE_URL =
  process.env.NEXT_PUBLIC_ORDER_FULFILMENT_SERVICE_URL ||
  'https://testapi.maplexpress.ca/orderfulfilment';

// Payment Service
export const PRICING_PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PRICING_PAYMENT_SERVICE_URL || 'https://testapi.maplexpress.ca/paymentservice';

// Google Maps API
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyA3wSq5PrN2evVDM5MiRKPa4ZS69taWS8E';

/**
 * Helper function to get the full URL for a specific endpoint
 */
export const getEndpointUrl = (baseUrl: string, endpoint: string): string => {
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const MONERIS_API_CONFIG = {
  baseUrl: "https://testapi.maplexpress.ca/pricingpayment/moneris/"
};