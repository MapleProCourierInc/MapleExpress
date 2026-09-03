import { GOOGLE_MAPS_API_KEY } from "@/lib/config.public"

const GOOGLE_MAPS_API_URL = "https://maps.googleapis.com/maps/api/js"
const GOOGLE_MAPS_CANADA_PARAMS = `key=${encodeURIComponent(GOOGLE_MAPS_API_KEY || "")}&language=en&region=CA`

export const GOOGLE_MAPS_SCRIPT_URL = `${GOOGLE_MAPS_API_URL}?${GOOGLE_MAPS_CANADA_PARAMS}`
export const GOOGLE_MAPS_PLACES_SCRIPT_URL = `${GOOGLE_MAPS_SCRIPT_URL}&libraries=places&callback=initGoogleMapsAutocomplete`
