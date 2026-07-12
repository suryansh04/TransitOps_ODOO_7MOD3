export interface MonthlyRevenuePoint {
  month: string
  revenue: number
}

export interface CostliestVehiclePoint {
  vehicle_id: number
  registration_number: string
  total_cost: number
}

export interface AnalyticsResponse {
  fuel_efficiency_km_per_l: number
  fleet_utilization_percent: number
  operational_cost: number
  vehicle_roi_percent: number
  monthly_revenue: MonthlyRevenuePoint[]
  top_costliest_vehicles: CostliestVehiclePoint[]
}
