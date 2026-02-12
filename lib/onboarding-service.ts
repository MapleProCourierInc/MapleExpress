import type { MeResponse } from "@/lib/me-service"

export type OnboardingUserType = "INDIVIDUAL" | "ORGANIZATION"

export type IndividualOnboardingDetails = {
  firstName: string
  lastName: string
  dateOfBirth?: string
  phone?: string
  extensions?: Record<string, string>
}

export type OrganizationOnboardingDetails = {
  name: string
  phone: string
  email: string
  website?: string
  registrationNumber?: string
  taxID?: string
  industry?: string
  pointOfContact: {
    name: string
    email: string
    phone: string
    position?: string
  }
  extensions?: Record<string, string>
}

export type OnboardingPayload =
  | { userType: "INDIVIDUAL"; details: IndividualOnboardingDetails }
  | { userType: "ORGANIZATION"; details: OrganizationOnboardingDetails }

export type OnboardingResult = {
  success: boolean
  message: string
  statusCode?: number
  data?: MeResponse
}

export async function submitOnboarding(payload: OnboardingPayload): Promise<OnboardingResult> {
  const response = await fetch("/api/profile/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    return {
      success: false,
      message: data.message || "Failed to complete onboarding",
      statusCode: response.status,
    }
  }

  return {
    success: true,
    message: "Onboarding completed",
    data: data as MeResponse,
  }
}
