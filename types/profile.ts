import type { Address } from "./address"

export interface Discount {
  calculationMethod: string
  amount: number
  discountType: string
  createdAt: string
  expiredAt: string
}

export interface RelatedParty {
  relatedPartyId: string
  type: string
}

export interface BillingAccount {
  billingAccountId: string
}

export interface IndividualProfile {
  id: string
  userId: string
  status: string
  email: string
  firstName: string
  lastName: string
  dateOfBirth: string
  type: string
  address?: Address[]
  phone: string
  phoneNumberVerified?: boolean
  createdAt?: string
  updatedAt?: string
  relatedParty?: RelatedParty
  billingAccount?: BillingAccount
  discounts?: Discount[]
  extensions?: Record<string, string>
}

export interface PointOfContact {
  name: string
  position: string
  email: string
  phone: string
}

export interface OrganizationProfile {
  id: string
  userId: string
  status: string
  name: string
  registrationNumber?: string
  taxID?: string
  industry?: string
  address?: Address[]
  phone: string
  email: string
  website?: string
  createdAt?: string
  updatedAt?: string
  pointOfContact: PointOfContact
  billingAccount?: BillingAccount
  discounts?: Discount[]
  extensions?: Record<string, string>
}

