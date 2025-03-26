declare namespace google.maps {
  namespace places {
    class Autocomplete {
      constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions)
      addListener(eventName: string, handler: Function): void
      getPlace(): PlaceResult
    }

    interface AutocompleteOptions {
      bounds?: LatLngBounds | LatLngBoundsLiteral
      componentRestrictions?: ComponentRestrictions
      fields?: string[]
      strictBounds?: boolean
      types?: string[]
    }

    interface ComponentRestrictions {
      country: string | string[]
    }

    interface PlaceResult {
      address_components?: AddressComponent[]
      formatted_address?: string
      geometry?: {
        location: LatLng
        viewport: LatLngBounds
      }
      name?: string
      place_id?: string
      types?: string[]
    }

    interface AddressComponent {
      long_name: string
      short_name: string
      types: string[]
    }
  }

  class LatLng {
    constructor(lat: number, lng: number)
    lat(): number
    lng(): number
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng)
    extend(point: LatLng): LatLngBounds
    getCenter(): LatLng
    getNorthEast(): LatLng
    getSouthWest(): LatLng
    isEmpty(): boolean
  }

  interface LatLngBoundsLiteral {
    east: number
    north: number
    south: number
    west: number
  }

  namespace event {
    function clearInstanceListeners(instance: any): void
  }
}

