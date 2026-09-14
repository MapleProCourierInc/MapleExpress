export type ComparableShippingAddress = {
  streetAddress?: string | null
  addressLine2?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  country?: string | null
  coordinates?: {
    latitude?: number | null
    longitude?: number | null
  } | null
}

const CANADIAN_PROVINCES: Record<string, string> = {
  alberta: "ab",
  britishcolumbia: "bc",
  manitoba: "mb",
  newbrunswick: "nb",
  newfoundlandandlabrador: "nl",
  novascotia: "ns",
  ontario: "on",
  princeedwardisland: "pe",
  quebec: "qc",
  saskatchewan: "sk",
  northwestterritories: "nt",
  nunavut: "nu",
  yukon: "yt",
}

function normalizePart(value?: string | null) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}

function normalizeProvince(value?: string | null) {
  const normalized = normalizePart(value)
  return CANADIAN_PROVINCES[normalized] ?? normalized
}

function normalizeCountry(value?: string | null) {
  const normalized = normalizePart(value)
  if (normalized === "canada" || normalized === "ca") return "ca"
  if (normalized === "unitedstates" || normalized === "unitedstatesofamerica" || normalized === "usa" || normalized === "us") {
    return "us"
  }
  return normalized
}

function coordinatesMatch(first: ComparableShippingAddress, second: ComparableShippingAddress) {
  const firstLatitude = first.coordinates?.latitude
  const firstLongitude = first.coordinates?.longitude
  const secondLatitude = second.coordinates?.latitude
  const secondLongitude = second.coordinates?.longitude

  if (
    typeof firstLatitude !== "number" ||
    typeof firstLongitude !== "number" ||
    typeof secondLatitude !== "number" ||
    typeof secondLongitude !== "number" ||
    ![firstLatitude, firstLongitude, secondLatitude, secondLongitude].every(Number.isFinite)
  ) {
    return false
  }

  // About one metre at Canadian latitudes; enough for harmless geocoder rounding.
  return Math.abs(firstLatitude - secondLatitude) <= 0.00001 && Math.abs(firstLongitude - secondLongitude) <= 0.000015
}

/** Compares the physical destination and deliberately ignores recipient/contact fields. */
export function isSameShippingAddress(
  first?: ComparableShippingAddress | null,
  second?: ComparableShippingAddress | null,
) {
  if (!first || !second) return false

  const firstStreet = normalizePart(first.streetAddress)
  const secondStreet = normalizePart(second.streetAddress)
  const firstPostalCode = normalizePart(first.postalCode)
  const secondPostalCode = normalizePart(second.postalCode)
  const sameUnit = normalizePart(first.addressLine2) === normalizePart(second.addressLine2)

  const structuredAddressMatches = Boolean(firstStreet && secondStreet && (firstPostalCode || normalizePart(first.city))) &&
    firstStreet === secondStreet &&
    sameUnit &&
    normalizePart(first.city) === normalizePart(second.city) &&
    normalizeProvince(first.province) === normalizeProvince(second.province) &&
    firstPostalCode === secondPostalCode &&
    normalizeCountry(first.country) === normalizeCountry(second.country)

  return structuredAddressMatches || (sameUnit && coordinatesMatch(first, second))
}
