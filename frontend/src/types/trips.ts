export interface Trip {
  id: number
  trip_code: string
  source: string
  destination: string
  vehicle_id: number
  driver_id: number
  cargo_weight_kg: number
  planned_distance_km: number
  actual_distance_km: number | null
  final_odometer_km: number | null
  fuel_consumed_liters: number | null
  revenue_amount: number | null
  status: "draft" | "dispatched" | "completed" | "cancelled"
  eta: string | null
  dispatched_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface TripCreate {
  source: string
  destination: string
  vehicle_id: number
  driver_id: number
  cargo_weight_kg: number
  planned_distance_km: number
  revenue_amount: number
}

export interface TripDispatch {
  eta: string
}

export interface TripComplete {
  final_odometer_km: number
  actual_distance_km: number
  fuel_consumed_liters: number
  fuel_cost: number
}
