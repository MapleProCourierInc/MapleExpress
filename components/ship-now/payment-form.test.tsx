import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import { PaymentForm } from './payment-form'
import * as AuthContext from '@/lib/auth-context'
import * as PaymentService from '@/lib/payment-service'
import * as MonerisService from '../../lib/moneris/moneris-service'

jest.mock('@/lib/auth-context')
jest.mock('@/lib/payment-service')
jest.mock('../../lib/moneris/moneris-service')

const mockedAuthContext = AuthContext as jest.Mocked<typeof AuthContext>
const mockedPaymentService = PaymentService as jest.Mocked<typeof PaymentService>
const mockedMonerisService = MonerisService as jest.Mocked<typeof MonerisService>

const mockMonerisCheckoutInstance = {
  setMode: jest.fn(),
  setCheckoutDiv: jest.fn(),
  setCallback: jest.fn(),
  startCheckout: jest.fn(),
  closeCheckout: jest.fn(),
}

Object.defineProperty(window, 'monerisCheckout', {
  value: jest.fn(() => mockMonerisCheckoutInstance),
  writable: true,
})

const mockOrderData = {
  shippingOrderId: 'order123',
  updatedAt: '2025-01-01T00:00:00Z',
  aggregatedPricing: {
    totalAmount: 150,
    basePrice: 100,
    distanceCharge: 20,
    weightCharge: 10,
    prioritySurcharge: 0,
    taxes: [{ taxType: 'HST', amount: 20 }],
  },
  orderItems: [
    {
      pickup: {
        address: {
          fullName: 'Pickup Person',
          streetAddress: '1 Main St',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'A1A1A1',
          country: 'CA',
          phoneNumber: '1112223333',
        },
      },
    },
  ],
} as any

describe('PaymentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockedAuthContext.useAuth.mockReturnValue({ user: { userId: 'user-test-123' } } as any)
    mockedMonerisService.loadMonerisScript.mockResolvedValue()
    mockedPaymentService.buildCheckoutBillingAddress.mockReturnValue({
      fullName: 'Pickup Person',
      streetAddress: '1 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'A1A1A1',
      country: 'CA',
      phoneNumber: '1112223333',
    })
  })

  it('does not render billing address inputs', async () => {
    render(<PaymentForm orderData={mockOrderData} onBack={jest.fn()} onPaymentComplete={jest.fn()} isProcessing={false} />)

    expect(screen.queryByText('Billing Address')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Same as pickup address')).not.toBeInTheDocument()
  })

  it('starts Moneris when checkout API returns MONERIS', async () => {
    mockedPaymentService.checkoutPayment.mockResolvedValueOnce({
      paymentId: 'payment-1',
      shippingOrderId: 'order123',
      checkoutFlow: 'MONERIS',
      status: 'PENDING',
      paymentMethodType: 'CARD',
      paymentProvider: 'MONERIS',
      ticketId: 'ticket-123',
      amount: 150,
      currency: 'CAD',
    })

    render(<PaymentForm orderData={mockOrderData} onBack={jest.fn()} onPaymentComplete={jest.fn()} isProcessing={false} />)

    await waitFor(() => expect(window.monerisCheckout).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: /Proceed to Secure Payment/i }))

    await waitFor(() => {
      expect(mockedPaymentService.checkoutPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingOrderId: 'order123',
          amount: 150,
          currency: 'CAD',
        }),
      )
    })

    await waitFor(() => {
      expect(mockMonerisCheckoutInstance.startCheckout).toHaveBeenCalledWith('ticket-123')
    })
  })

  it('completes immediately when checkout flow is POSTPAY_BILLING_ACCOUNT', async () => {
    const onPaymentComplete = jest.fn()

    mockedPaymentService.checkoutPayment.mockResolvedValueOnce({
      paymentId: 'payment-2',
      shippingOrderId: 'order123',
      checkoutFlow: 'POSTPAY_BILLING_ACCOUNT',
      status: 'PAID',
      paymentMethodType: 'POSTPAY_BILLING_ACCOUNT',
      amount: 150,
      currency: 'CAD',
      message: 'Posted to billing account',
    })

    render(<PaymentForm orderData={mockOrderData} onBack={jest.fn()} onPaymentComplete={onPaymentComplete} isProcessing={false} />)

    fireEvent.click(screen.getByRole('button', { name: /Proceed to Secure Payment/i }))

    await waitFor(() => {
      expect(onPaymentComplete).toHaveBeenCalledWith('order123')
    })
    expect(mockMonerisCheckoutInstance.startCheckout).not.toHaveBeenCalled()
  })
})
