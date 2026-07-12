from pydantic import BaseModel
from typing import List, Optional

class SettingUpdate(BaseModel):
    depot_name: Optional[str] = None
    currency: Optional[str] = None
    distance_unit: Optional[str] = None

class SettingResponse(BaseModel):
    depot_name: str
    currency: str
    distance_unit: str
    class Config:
        from_attributes = True

class RecentTrip(BaseModel):
    trip_code: str
    vehicle_registration_number: str
    vehicle_name_model: str
    vehicle_type: str
    driver_name: str
    status: str
    eta: str

class VehicleStatusBreakdown(BaseModel):
    available: int
    on_trip: int
    in_shop: int
    retired: int

class DashboardResponse(BaseModel):
    active_vehicles: int
    available_vehicles: int
    vehicles_in_maintenance: int
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization_percent: float
    recent_trips: List[RecentTrip]
    vehicle_status_breakdown: VehicleStatusBreakdown

class MonthlyRevenue(BaseModel):
    month: str
    revenue: float

class CostliestVehicle(BaseModel):
    vehicle_id: int
    registration_number: str
    total_cost: float

class AnalyticsResponse(BaseModel):
    fuel_efficiency_km_per_l: float
    fleet_utilization_percent: float
    operational_cost: float
    vehicle_roi_percent: float
    monthly_revenue: List[MonthlyRevenue]
    top_costliest_vehicles: List[CostliestVehicle]
