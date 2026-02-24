export type AdminDriverItem = {
  driverId: string
  userId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  station: string
  companyName: string
  profileStatus: string
  createdAt: string
  updatedAt: string
  isVerified: boolean
  backgroundCheckStatus: string
}

export type AdminDriversResponse = {
  items: AdminDriverItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type ApiErrorResponse = {
  status?: string
  message?: string
  errors?: Array<{
    field?: string
    message?: string
  }>
  errorDetails?: {
    errorCode?: number
    errorType?: string
    characteristics?: Record<string, string>
  }
}

export type AdminDriversQuery = {
  email?: string
  name?: string
  station?: string
  companyName?: string
  profileStatus?: string
  page: number
  size: number
}
