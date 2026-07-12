export interface Vehicle {
  id: number
  registration_number: string
  name_model: string
  type: string
  max_load_capacity_kg: number
  odometer_km: number
  acquisition_cost: number
  status: "available" | "on_trip" | "in_shop" | "retired"
  region: string | null
  created_at: string
  updated_at: string
}

export interface Driver {
  id: number
  name: string
  license_number: string
  license_category: string
  license_expiry_date: string
  contact_number: string
  safety_score: number
  trips_assigned: number
  trips_completed: number
  status: "available" | "on_trip" | "off_duty" | "suspended"
  created_at: string
  updated_at: string
}
