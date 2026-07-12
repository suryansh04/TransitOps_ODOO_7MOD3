from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight_kg: float
    planned_distance_km: float
    revenue_amount: float

class TripDispatch(BaseModel):
    eta: datetime

class TripComplete(BaseModel):
    final_odometer_km: float
    actual_distance_km: float
    fuel_consumed_liters: float
    fuel_cost: float

class TripResponse(TripCreate):
    id: int
    trip_code: str
    revenue_amount: Optional[float]  # nullable in DB for seeded/older trips
    actual_distance_km: Optional[float]
    final_odometer_km: Optional[float]
    fuel_consumed_liters: Optional[float]
    status: str
    eta: Optional[datetime]
    dispatched_at: Optional[datetime]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class AvailableDriverForTrip(BaseModel):
    id: int
    name: str
    license_category: str
    status: str
    class Config:
        from_attributes = True

class FuelLogCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    log_date: date
    liters: float
    cost: float

class FuelLogResponse(FuelLogCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    trip_id: Optional[int] = None
    vehicle_id: int
    toll_amount: float = 0
    other_amount: float = 0
    expense_date: date

class ExpenseResponse(ExpenseCreate):
    id: int
    maintenance_linked_cost: float
    total_amount: float
    created_at: datetime
    class Config:
        from_attributes = True
