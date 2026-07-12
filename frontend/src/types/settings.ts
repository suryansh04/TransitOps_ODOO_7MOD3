export interface OrgSettings {
  depot_name: string
  currency: string
  distance_unit: string
}

export interface OrgSettingsUpdate {
  depot_name?: string
  currency?: string
  distance_unit?: string
}

export interface RbacPermissionRow {
  role: string
  label: string
  fleet: string
  drivers: string
  trips: string
  fuel_expenses: string
  analytics: string
  settings: string
}
