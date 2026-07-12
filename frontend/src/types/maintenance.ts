import { Vehicle } from "@/types/fleet"

export interface MaintenanceRecord {
  id: number
  vehicle_id: number
  service_type: string
  cost: number
  service_date: string
  status: "active" | "completed"
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceCreate {
  vehicle_id: number
  service_type: string
  cost: number
  service_date: string
}

export interface MaintenanceUpdate {
  status: "completed"
}

export interface MaintenanceViewRecord extends MaintenanceRecord {
  vehicle?: Vehicle
}
