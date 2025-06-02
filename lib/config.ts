/**
 * Configuration file for backend service URLs and other environment variables.
 * These values can be overridden by setting environment variables in .env or .env.local files.
 */

// Auth Service
export const AUTH_MICROSERVICE_URL = process.env.AUTH_MICROSERVICE_URL || 'http://localhost:30080/usermanagement/auth';
export const AUTH_REFRESH_URL = process.env.AUTH_REFRESH_URL || `${AUTH_MICROSERVICE_URL}/refresh`;
export const AUTH_API_KEY = process.env.AUTH_API_KEY || '';

// Profile Service
export const PROFILE_SERVICE_URL = process.env.NEXT_PUBLIC_PROFILE_SERVICE_URL || 'http://localhost:30081/usermanagement';

// Order Service
export const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:30082/ordermanagement';

// Payment Service
export const PRICING_PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PRICING_PAYMENT_SERVICE_URL || 'http://localhost:30083/paymentservice';

// Google Maps API
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/**
 * Helper function to get the full URL for a specific endpoint
 */
export const getEndpointUrl = (baseUrl: string, endpoint: string): string => {
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const MONERIS_API_CONFIG = {
  baseUrl: "https://testapi.maplexpress.ca/pricingpayment/moneris/"
};