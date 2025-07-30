export interface MetaData {
  inspector: Inspector
  property: Property
}

export interface Inspector {
  name: string
  company: string
  address: string
}

export interface Property {
  type: string
  occupancy: string
  attendance: string[]
}