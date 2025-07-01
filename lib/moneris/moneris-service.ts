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
    // Attempt to parse error JSON, but provide a fallback message if parsing fails or body is empty
    const errorText = await response.text();
    let errorData = { message: `Failed to finalize Moneris payment. Status: ${response.status}` };
    if (errorText) {
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // Use the raw text if it's not JSON, or stick to the generic error if text is also unhelpful
        errorData.message = errorText.substring(0, 200) || errorData.message; // Limit length of non-JSON error
      }
    }
    throw new Error(errorData.message || 'Failed to finalize Moneris payment.');
  }

  // Handle successful response (2xx status codes)
  // Check if the response has content before trying to parse it as JSON
  const responseText = await response.text();
  if (responseText) {
    try {
      return JSON.parse(responseText) as FinalizePaymentResponse;
    } catch (error) {
      // If parsing fails for a 2xx response with content, this is unexpected.
      console.error("Failed to parse JSON from a successful (2xx) finalize payment response that had content:", errorText);
      throw new Error("Received an invalid JSON response from finalize payment.");
    }
  } else {
    // If the response is OK (e.g., 200) but the body is empty,
    // return a synthetic success response as per application logic.
    // This handles the "Unexpected end of JSON input" for empty 200 OK.
    if (response.status === 200 || response.status === 204) { // 204 No Content is also a possibility
      return { success: true, message: "Payment finalized successfully (no content)." } as FinalizePaymentResponse;
    } else {
      // For other 2xx statuses that are expected to have content but don't
      console.warn(`Finalize payment returned status ${response.status} with empty body.`);
      return { success: true, message: `Payment finalized with status ${response.status} (empty body).` } as FinalizePaymentResponse;
    }
  }
}

const MONERIS_SCRIPT_ID = 'moneris-checkout-script';
const MONERIS_SCRIPT_SRC = 'https://gatewayt.moneris.com/chkt/js/chkt_v1.00.js';

const CHECK_INTERVAL = 100; // ms
const MAX_ATTEMPTS = 50; // e.g., 50 attempts * 100ms = 5 seconds timeout

export function loadMonerisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window object not available. Cannot load Moneris script.'));
    }

    if (window.monerisCheckout) {
      return resolve();
    }
    
    if (document.getElementById(MONERIS_SCRIPT_ID)) {
      let attempts = 0;
      const intervalId = setInterval(() => {
        if (window.monerisCheckout) {
          clearInterval(intervalId);
          resolve();
        } else {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            clearInterval(intervalId);
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
      let attempts = 0;
      const intervalId = setInterval(() => {
        if (window.monerisCheckout) {
          clearInterval(intervalId);
          resolve();
        } else {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            clearInterval(intervalId);
            reject(new Error('Moneris script loaded, but window.monerisCheckout not found after onload timeout.'));
          }
        }
      }, CHECK_INTERVAL);
    };

    script.onerror = () => {
      reject(new Error('Failed to load Moneris script.'));
    };

    document.head.appendChild(script);
  });
}
declare global {
    interface Window {
        monerisCheckout?: any; 
    }
}
