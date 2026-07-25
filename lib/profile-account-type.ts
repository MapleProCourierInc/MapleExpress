export type ClientAccountType = "individual" | "organization"

export function isAdminAccount(groups?: string[] | null) {
  return Boolean(groups?.some((group) => group === "admin_super" || group === "admin_limited"))
}

export function getClientAccountType(groups?: string[] | null, fallbackUserType?: string | null): ClientAccountType {
  if (groups?.includes("client_organization")) return "organization"
  if (groups?.includes("client_individual")) return "individual"

  const normalized = fallbackUserType?.toLowerCase()
  if (normalized === "businessuser" || normalized === "organization" || normalized === "organizationuser") {
    return "organization"
  }

  return "individual"
}

export function getUserTypeFromGroups(groups?: string[] | null, fallbackUserType?: string | null) {
  if (groups?.includes("admin_super")) return "admin_super"
  if (groups?.includes("admin_limited")) return "admin_limited"

  return getClientAccountType(groups, fallbackUserType) === "organization" ? "businessUser" : "individualUser"
}

export function isOrganizationAccount(groups?: string[] | null, fallbackUserType?: string | null) {
  return getClientAccountType(groups, fallbackUserType) === "organization"
}

export function isIndividualAccount(groups?: string[] | null, fallbackUserType?: string | null) {
  return getClientAccountType(groups, fallbackUserType) === "individual"
}

export function profileAccountTypeLabel(groups?: string[] | null, fallbackUserType?: string | null) {
  return isOrganizationAccount(groups, fallbackUserType) ? "Business" : "Individual"
}
