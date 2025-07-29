export interface ReportData {
  inspector: Inspector
  property: Property
  sections: Sections
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

export interface Sections {
  [sectionName: string]: Section
}

export interface Section {
  [itemName: string]: SectionItem
}

export interface SectionItem {
  condition: string
  observations?: string[]
  materials?: string[]
  locaton?: string[]
  pictures?: any[]
}