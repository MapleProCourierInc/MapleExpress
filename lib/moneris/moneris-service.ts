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

export async function finalizeMonerisPayment(
    requestData: FinalizePaymentRequest,
    token: string,
): Promise<FinalizePaymentResponse> {
  const res = await fetch(`${MONERIS_API_CONFIG.baseUrl}finalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestData),
  });

  /* ───── error branch ───── */
  if (!res.ok) {
    const raw = await res.text(); // may be empty or non-JSON
    let msg = `Failed to finalize Moneris payment. Status ${res.status}`;

    if (raw) {
      try {
        const errJson = JSON.parse(raw) as { message?: string };
        msg = errJson.message ?? msg;
      } catch {
        // plain-text error – clip to first 200 chars
        msg = raw.slice(0, 200);
      }
    }
    throw new Error(msg);
  }

  /* ───── success branch ───── */
  const raw = await res.text(); // never throws even if empty

  // 1. Empty body → treat as silent success
  if (!raw) {
    return {
      success: true,
      message:
          res.status === 204
              ? "Payment finalized successfully (no content)."
              : `Payment finalized with status ${res.status} (empty body).`,
    } as FinalizePaymentResponse;
  }

  // 2. Try to parse non-empty body as JSON
  try {
    return JSON.parse(raw) as FinalizePaymentResponse;
  } catch (e) {
    console.error(
        "Finalize payment returned non-JSON payload:",
        raw.substring(0, 200),
    );
    throw new Error("Received an invalid JSON response from finalize payment.");
  }
}

const MONERIS_SCRIPT_ID = 'moneris-checkout-script';
const MONERIS_SCRIPT_SRC = 'https://gateway.moneris.com/chkt/js/chkt_v1.00.js';

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
