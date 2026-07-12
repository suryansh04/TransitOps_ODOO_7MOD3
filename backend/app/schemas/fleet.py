from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class VehicleBase(BaseModel):
    registration_number: str
    name_model: str
    type: str
    max_load_capacity_kg: float
    odometer_km: float = 0
    acquisition_cost: float
    region: Optional[str] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    name_model: Optional[str] = None
    type: Optional[str] = None
    max_load_capacity_kg: Optional[float] = None
    odometer_km: Optional[float] = None
    acquisition_cost: Optional[float] = None
    region: Optional[str] = None
    status: Optional[str] = None

class VehicleResponse(VehicleBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class DriverBase(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry_date: Optional[date] = None
    contact_number: Optional[str] = None
    status: Optional[str] = None

class DriverResponse(DriverBase):
    id: int
    safety_score: float
    trips_assigned: int
    trips_completed: int
    status: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    service_type: str
    cost: float
    service_date: date

class MaintenanceUpdate(BaseModel):
    status: str

class MaintenanceResponse(MaintenanceCreate):
    id: int
    status: str
    closed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
