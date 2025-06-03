import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentForm } from './payment-form';
import * as MonerisService from '../../lib/moneris/moneris-service';
import * as AuthContext from '@/lib/auth-context'; // Assuming path
import * as AddressService from '@/lib/address-service';
import * as PaymentService from '@/lib/payment-service'; // For convertToBillingAddress

// Mock Moneris Service
jest.mock('../../lib/moneris/moneris-service');
const mockedMonerisService = MonerisService as jest.Mocked<typeof MonerisService>;

// Mock Auth Context
jest.mock('@/lib/auth-context');
const mockedAuthContext = AuthContext as jest.Mocked<typeof AuthContext>;

// Mock Address Service
jest.mock('@/lib/address-service');
const mockedAddressService = AddressService as jest.Mocked<typeof AddressService>;

// Mock Payment Service (for convertToBillingAddress) - it's a util, so direct mock is fine
jest.mock('@/lib/payment-service', () => ({
    ...jest.requireActual('@/lib/payment-service'), // Import and retain default exports
    convertToBillingAddress: jest.fn(addr => addr), // Simple mock: returns address as is
}));


// Mock localStorage
const mockLocalStorage = (() => {
    let store: { [key: string]: string } = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.monerisCheckout
const mockMonerisCheckoutInstance = {
    setMode: jest.fn(),
    setCheckoutDiv: jest.fn(),
    setCallback: jest.fn(),
    startCheckout: jest.fn(),
    closeCheckout: jest.fn(),
};
Object.defineProperty(window, 'monerisCheckout', {
    value: jest.fn(() => mockMonerisCheckoutInstance),
    writable: true,
});


const mockOrderData = {
    shippingOrderId: 'order123',
    aggregatedPricing: { totalAmount: 150.00, basePrice: 100, distanceCharge: 20, weightCharge:10, prioritySurcharge: 0, taxes: [{taxType: "HST", amount: 20}] },
    orderItems: [{ pickup: { address: { fullName: 'Pickup Person' } } }], // Simplified
    priorityDelivery: false,
} as any; // Cast to any to simplify mock data structure for OrderResponse

const mockUser = { userId: 'user-test-123' };

describe('PaymentForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedAuthContext.useAuth.mockReturnValue({ user: mockUser } as any);
        mockedAddressService.getAddresses.mockResolvedValue([]); // Default mock for getAddresses
        mockedMonerisService.loadMonerisScript.mockResolvedValue(); // Assume script loads successfully by default
        mockLocalStorage.setItem('maplexpress_access_token', 'test-access-token');
    });

    it('renders correctly and attempts to load Moneris script', async () => {
        render(
            <PaymentForm
                orderData={mockOrderData}
                onBack={jest.fn()}
                onPaymentComplete={jest.fn()}
                isProcessing={false}
            />
        );
        expect(screen.getByText('Payment Details')).toBeInTheDocument();
        expect(mockedMonerisService.loadMonerisScript).toHaveBeenCalledTimes(1);
        // Wait for script loading and monerisCheckout instantiation
        await waitFor(() => expect(window.monerisCheckout).toHaveBeenCalled());
        await waitFor(() => expect(mockMonerisCheckoutInstance.setMode).toHaveBeenCalledWith('qa'));
    });
    
    it('handles billing address selection', async () => {
        render(<PaymentForm orderData={mockOrderData} onBack={jest.fn()} onPaymentComplete={jest.fn()} isProcessing={false} />);
        // Simulate user selecting/entering a billing address.
        // This part is complex due to the AddressForm interaction.
        // For a focused test, one might pre-set billingAddress via props or internal state if possible,
        // or trigger the AddressForm's onSubmit.
        // For now, we'll assume billingAddress gets set and test the submit.
        // A more detailed test would involve interacting with the AddressForm component.
        
        // Click "Add a new address"
        fireEvent.click(screen.getByText("Add a new address"));
        
        // Fill the address form (simplified)
        // Actual implementation would require data-testid or more robust selectors on AddressForm inputs
        // For this example, we'll skip to the submit part after address is assumed to be filled.
    });


    it('calls initiateMonerisPayment and startCheckout on submit if billing address is present', async () => {
        mockedMonerisService.initiateMonerisPayment.mockResolvedValueOnce({ ticketId: 'new-ticket-123' });
        
        render(
            <PaymentForm
                orderData={mockOrderData}
                onBack={jest.fn()}
                onPaymentComplete={jest.fn()}
                isProcessing={false}
            />
        );

        // Wait for Moneris to be initialized
        await waitFor(() => expect(window.monerisCheckout).toHaveBeenCalled());
        
        // Simulate having a billing address (e.g. by using "Same as pickup address")
        fireEvent.click(screen.getByLabelText('Same as pickup address'));
        
        // Check if the "Proceed to Secure Payment" button is enabled
        const paymentButton = screen.getByRole('button', { name: /Proceed to Secure Payment/i });
        await waitFor(() => expect(paymentButton).not.toBeDisabled());
        
        fireEvent.click(paymentButton);

        await waitFor(() => {
            expect(mockedMonerisService.initiateMonerisPayment).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUser.userId,
                    shippingOrderId: mockOrderData.shippingOrderId,
                    amount: mockOrderData.aggregatedPricing.totalAmount,
                }),
                'test-access-token'
            );
        });
        await waitFor(() => {
            expect(mockMonerisCheckoutInstance.startCheckout).toHaveBeenCalledWith('new-ticket-123');
        });
    });

    it('handles payment_complete callback, calls finalize and onPaymentComplete prop', async () => {
        const onPaymentCompletePropMock = jest.fn();
        mockedMonerisService.finalizeMonerisPayment.mockResolvedValueOnce({ success: true, orderId: 'final-order-id' });

        render(
            <PaymentForm
                orderData={mockOrderData}
                onBack={jest.fn()}
                onPaymentComplete={onPaymentCompletePropMock}
                isProcessing={false}
            />
        );

        // Wait for Moneris to be initialized and callbacks set
        await waitFor(() => expect(mockMonerisCheckoutInstance.setCallback).toHaveBeenCalledWith('payment_complete', expect.any(Function)));

        // Find the payment_complete callback and invoke it
        const paymentCompleteCallback = mockMonerisCheckoutInstance.setCallback.mock.calls.find(
            call => call[0] === 'payment_complete'
        )?.[1];

        expect(paymentCompleteCallback).toBeDefined();
        if (paymentCompleteCallback) {
             paymentCompleteCallback({ ticket: 'ticket-from-moneris', response_code: "001" });
        }

        await waitFor(() => {
            expect(mockedMonerisService.finalizeMonerisPayment).toHaveBeenCalledWith(
                { ticketId: 'ticket-from-moneris' },
                'test-access-token'
            );
        });
        await waitFor(() => {
            expect(onPaymentCompletePropMock).toHaveBeenCalledWith(mockOrderData.shippingOrderId);
        });
         await waitFor(() => {
            expect(mockMonerisCheckoutInstance.closeCheckout).toHaveBeenCalledWith('ticket-from-moneris');
        });
    });
    
    it('displays an error message if initiateMonerisPayment fails', async () => {
        mockedMonerisService.initiateMonerisPayment.mockRejectedValueOnce(new Error('Initiate failed!'));
        render(<PaymentForm orderData={mockOrderData} onBack={jest.fn()} onPaymentComplete={jest.fn()} isProcessing={false} />);
        await waitFor(() => expect(window.monerisCheckout).toHaveBeenCalled()); // Ensure Moneris setup is complete

        fireEvent.click(screen.getByLabelText('Same as pickup address')); // Set billing address
        
        const paymentButton = screen.getByRole('button', { name: /Proceed to Secure Payment/i });
        await waitFor(() => expect(paymentButton).not.toBeDisabled());
        fireEvent.click(paymentButton);

        await waitFor(() => {
            expect(screen.getByText('Initiate failed!')).toBeInTheDocument();
        });
    });

    // Add more tests:
    // - error during finalizeMonerisPayment
    // - Moneris cancel_transaction callback
    // - Moneris error_event callback
    // - Script loading failure
    // - User not authenticated / no token
    // - Billing address not selected
});
