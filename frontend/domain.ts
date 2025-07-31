import type * as Y from 'yjs'

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

export interface Doc {
  docId: string
  doc: Y.Doc
  updatedAt: string
}