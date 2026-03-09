export type ServiceZonePolygon = {
  type: "Polygon"
  coordinates: number[][][]
}

export type ServiceZone = {
  id: string
  zoneName: string
  city: string
  station: string
  active: boolean
  priority: number
  polygon: ServiceZonePolygon
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

export type CreateServiceZoneRequest = {
  zoneName: string
  city: string
  station: string
  active: boolean
  priority: number
  polygon: ServiceZonePolygon
}

export type CreateServiceZoneResponse = {
  serviceZone: ServiceZone
}

export type ListServiceZonesResponse = {
  serviceZones: ServiceZone[]
}

export type ToggleServiceZoneActiveRequest = {
  active: boolean
}

export type ToggleServiceZoneActiveResponse = {
  serviceZone: ServiceZone
}

export type ServiceZoneApiError = {
  status?: string
  message?: string
  errors?: Array<{ field?: string; message?: string }>
}
