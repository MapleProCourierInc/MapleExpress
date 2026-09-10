/**
 * Browser-visible application configuration.
 *
 * Next.js embeds every `NEXT_PUBLIC_*` value into client JavaScript during
 * `pnpm build`. Supply these values to the Docker/CI build; changing only the
 * K3s pod environment will not update an image that has already been built.
 * The fallback values are retained for local development and tests.
 */

// Moneris checkout client library. Merchant credentials remain in the backend.
export const MONERIS_CHECKOUT_SCRIPT_SRC = process.env.NEXT_PUBLIC_MONERIS_CHECKOUT_SCRIPT_SRC || "https://gatewayt.moneris.com/chkt/js/chkt_v1.00.js"
export const MONERIS_CHECKOUT_MODE = process.env.NEXT_PUBLIC_MONERIS_CHECKOUT_MODE || "qa"

// Browser-visible key: restrict it by allowed origins and APIs in Google Cloud.
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
