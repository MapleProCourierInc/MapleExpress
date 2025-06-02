// Moneris Service
// This service will handle interactions with the Moneris backend APIs
// and the Moneris frontend JavaScript library.

import { MONERIS_API_CONFIG } from '../config'; 
import type { Address } from '../../components/ship-now/ship-now-form'; 

export interface MonerisBillingAddress {
    fullName: string;
    company?: string;
    streetAddress: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
}

export interface InitiatePaymentResponse {
  ticketId: string;
}

export interface InitiatePaymentRequest {
  userId: string;
  shippingOrderId: string;
  amount: number;
  billingAddress: MonerisBillingAddress; 
}

export interface FinalizePaymentRequest {
  ticketId: string;
}

export interface FinalizePaymentResponse {
  success: boolean;
  message?: string;
  orderId?: string;
}

export async function initiateMonerisPayment(requestData: InitiatePaymentRequest, token: string): Promise<InitiatePaymentResponse> {
  const response = await fetch(`${MONERIS_API_CONFIG.baseUrl}initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, 
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from initiate payment' }));
    throw new Error(errorData.message || 'Failed to initiate Moneris payment.');
  }

  return response.json() as Promise<InitiatePaymentResponse>;
}

export async function finalizeMonerisPayment(requestData: FinalizePaymentRequest, token: string): Promise<FinalizePaymentResponse> {
  const response = await fetch(`${MONERIS_API_CONFIG.baseUrl}finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, 
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from finalize payment' }));
    throw new Error(errorData.message || 'Failed to finalize Moneris payment.');
  }
  return response.json() as Promise<FinalizePaymentResponse>;
}

// Add these helper constants at the top of the file or within the function's scope if preferred
const MONERIS_SCRIPT_ID = 'moneris-checkout-script';
const MONERIS_SCRIPT_SRC = 'https://gatewayt.moneris.com/chkt/js/chkt_v1.00.js'; // Ensure this is the correct URL (test/prod)

// Polling parameters
const CHECK_INTERVAL = 100; // ms
const MAX_ATTEMPTS = 50; // e.g., 50 attempts * 100ms = 5 seconds timeout

export function loadMonerisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      // Should not happen in a browser context, but good for safety
      return reject(new Error('Window object not available. Cannot load Moneris script.'));
    }

    if (window.monerisCheckout) {
      // If already available (e.g., loaded by a previous call or another script)
      console.log('Moneris checkout object already available on window.');
      return resolve();
    }
    
    if (document.getElementById(MONERIS_SCRIPT_ID)) {
      // Script tag exists, but window.monerisCheckout might not be ready yet.
      // Start polling for window.monerisCheckout
      console.log('Moneris script tag found. Starting to poll for window.monerisCheckout.');
      let attempts = 0;
      const intervalId = setInterval(() => {
        if (window.monerisCheckout) {
          clearInterval(intervalId);
          console.log('Moneris checkout object became available after polling.');
          resolve();
        } else {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            clearInterval(intervalId);
            console.error('Moneris script loaded, but window.monerisCheckout did not become available within timeout.');
            reject(new Error('Moneris script loaded, but window.monerisCheckout not found after timeout.'));
          }
        }
      }, CHECK_INTERVAL);
      return;
    }

    const script = document.createElement('script');
    script.id = MONERIS_SCRIPT_ID;
    script.src = MONERIS_SCRIPT_SRC;
    script.async = true;

    script.onload = () => {
      console.log('Moneris script tag loaded (onload event). Starting to poll for window.monerisCheckout.');
      let attempts = 0;
      const intervalId = setInterval(() => {
        if (window.monerisCheckout) {
          clearInterval(intervalId);
          console.log('Moneris checkout object available after script load and polling.');
          resolve();
        } else {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            clearInterval(intervalId);
            console.error('Moneris script loaded, but window.monerisCheckout did not become available within timeout (onload path).');
            reject(new Error('Moneris script loaded, but window.monerisCheckout not found after onload timeout.'));
          }
        }
      }, CHECK_INTERVAL);
    };

    script.onerror = () => {
      console.error('Failed to load Moneris script tag (onerror event).');
      reject(new Error('Failed to load Moneris script.'));
    };

    document.head.appendChild(script);
    console.log('Moneris script tag appended to head.');
  });
}
declare global {
    interface Window {
        monerisCheckout?: any; // Make it optional as it might not be immediately available
    }
}
