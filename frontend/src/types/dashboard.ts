export interface RecentTrip {
  trip_code: string;
  vehicle_registration_number: string;
  vehicle_name_model: string;
  vehicle_type: string;
  driver_name: string;
  status: string;
  eta: string;
}

export interface VehicleStatusBreakdown {
  available: number;
  on_trip: number;
  in_shop: number;
  retired: number;
}

export interface DashboardData {
  active_vehicles: number;
  available_vehicles: number;
  vehicles_in_maintenance: number;
  active_trips: number;
  pending_trips: number;
  drivers_on_duty: number;
  fleet_utilization_percent: number;
  recent_trips: RecentTrip[];
  vehicle_status_breakdown: VehicleStatusBreakdown;
}
