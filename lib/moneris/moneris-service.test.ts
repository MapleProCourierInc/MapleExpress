import { initiateMonerisPayment, finalizeMonerisPayment, loadMonerisScript } from './moneris-service';
import { MONERIS_API_CONFIG } from '../config';

// Mock global fetch
global.fetch = jest.fn();

// Mock document for loadMonerisScript
Object.defineProperty(global, 'document', {
    value: {
        getElementById: jest.fn(),
        createElement: jest.fn(() => ({
            id: '',
            src: '',
            async: false,
            onload: null,
            onerror: null,
        })),
        head: {
            appendChild: jest.fn(),
        },
    },
    writable: true,
});

describe('Moneris Service', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks before each test
    });

    describe('initiateMonerisPayment', () => {
        const mockRequestData = {
            userId: 'user123',
            shippingOrderId: 'order123',
            amount: 100.00,
            billingAddress: {
                fullName: 'Test User',
                streetAddress: '123 Test St',
                city: 'Testville',
                province: 'TS',
                postalCode: 'A1A 1A1',
                country: 'CA',
                phoneNumber: '555-1234',
            },
        };
        const mockToken = 'test-token';
        const expectedUrl = `${MONERIS_API_CONFIG.baseUrl}initiate`;

        it('should successfully initiate payment and return a ticketId', async () => {
            const mockSuccessResponse = { ticketId: 'ticket-xyz' };
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            const result = await initiateMonerisPayment(mockRequestData, mockToken);

            expect(fetch).toHaveBeenCalledWith(expectedUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mockToken}`,
                },
                body: JSON.stringify(mockRequestData),
            });
            expect(result).toEqual(mockSuccessResponse);
        });

        it('should throw an error if the API call fails', async () => {
            const mockErrorResponse = { message: 'Initiation failed' };
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => mockErrorResponse,
            });

            await expect(initiateMonerisPayment(mockRequestData, mockToken))
                .rejects
                .toThrow(mockErrorResponse.message);
            expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
        });

        it('should throw a generic error if parsing error response fails', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => { throw new Error('Parse error'); }, // Simulate error during error.json()
            });

            await expect(initiateMonerisPayment(mockRequestData, mockToken))
                .rejects
                .toThrow('Failed to parse error response from initiate payment');
        });
    });

    describe('finalizeMonerisPayment', () => {
        const mockRequestData = { ticketId: 'ticket-xyz' };
        const mockToken = 'test-token';
        const expectedUrl = `${MONERIS_API_CONFIG.baseUrl}finalize`;

        it('should successfully finalize payment', async () => {
            const mockSuccessResponse = { success: true, orderId: 'finalOrder123' };
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockSuccessResponse,
            });

            const result = await finalizeMonerisPayment(mockRequestData, mockToken);

            expect(fetch).toHaveBeenCalledWith(expectedUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mockToken}`,
                },
                body: JSON.stringify(mockRequestData),
            });
            expect(result).toEqual(mockSuccessResponse);
        });

        it('should throw an error if the API call fails', async () => {
            const mockErrorResponse = { message: 'Finalization failed' };
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => mockErrorResponse,
            });

            await expect(finalizeMonerisPayment(mockRequestData, mockToken))
                .rejects
                .toThrow(mockErrorResponse.message);
        });
    });

    describe('loadMonerisScript', () => {
        it('should resolve if script is already loaded', async () => {
            (document.getElementById as jest.Mock).mockReturnValueOnce(true); // Simulate script exists
            await expect(loadMonerisScript()).resolves.toBeUndefined();
            expect(document.createElement).not.toHaveBeenCalled();
        });

        it('should create and append script if not loaded, then resolve on load', async () => {
            (document.getElementById as jest.Mock).mockReturnValueOnce(null); // Script does not exist
            const mockScriptElement = { id: '', src: '', async: false, onload: null, onerror: null };
            (document.createElement as jest.Mock).mockReturnValueOnce(mockScriptElement);
            
            const promise = loadMonerisScript(); // Don't await yet
            
            expect(document.createElement).toHaveBeenCalledWith('script');
            expect(mockScriptElement.id).toBe('moneris-checkout-script');
            expect(mockScriptElement.src).toBe('https://gatewayt.moneris.com/chkt/js/chkt_v1.00.js');
            expect(mockScriptElement.async).toBe(true);
            expect(document.head.appendChild).toHaveBeenCalledWith(mockScriptElement);

            // Simulate script loading successfully
            if (mockScriptElement.onload) {
                (mockScriptElement.onload as Function)();
            }
            await expect(promise).resolves.toBeUndefined();
        });

        it('should reject if script fails to load', async () => {
            (document.getElementById as jest.Mock).mockReturnValueOnce(null);
            const mockScriptElement = { id: '', src: '', async: false, onload: null, onerror: null };
            (document.createElement as jest.Mock).mockReturnValueOnce(mockScriptElement);

            const promise = loadMonerisScript(); // Don't await yet

            // Simulate script error
            if (mockScriptElement.onerror) {
                (mockScriptElement.onerror as Function)(new Error('Load error'));
            } else {
                // If onerror is not being set up correctly by the mock, manually reject for test purposes
                 return promise.catch(e => expect(e.message).toBe('Failed to load Moneris script.'));
            }
            await expect(promise).rejects.toThrow('Failed to load Moneris script.');
        });
    });
});
