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

export function loadMonerisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('moneris-checkout-script')) {
      resolve(); 
      return;
    }
    const script = document.createElement('script');
    script.id = 'moneris-checkout-script';
    script.src = 'https://gatewayt.moneris.com/chkt/js/chkt_v1.00.js'; 
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Moneris script.'));
    document.head.appendChild(script);
  });
}
