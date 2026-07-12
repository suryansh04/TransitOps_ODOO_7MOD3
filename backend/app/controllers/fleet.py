from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import require_permission
from app.schemas.fleet import VehicleCreate, VehicleUpdate, VehicleResponse, DriverCreate, DriverUpdate, DriverResponse, MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse
from app.models.domain import Vehicle, Driver, MaintenanceLog

router = APIRouter(prefix="/api")

@router.get("/vehicles", response_model=list[VehicleResponse])
def get_vehicles(type: str = None, status: str = None, region: str = None, db: Session = Depends(get_db), user = Depends(require_permission("fleet"))):
    q = db.query(Vehicle)
    if type: q = q.filter(Vehicle.type == type)
    if status: q = q.filter(Vehicle.status == status)
    if region: q = q.filter(Vehicle.region == region)
    return q.all()

@router.get("/vehicles/{id}", response_model=VehicleResponse)
def get_vehicle(id: int, db: Session = Depends(get_db), user = Depends(require_permission("fleet"))):
    v = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not v: raise HTTPException(404, "Vehicle not found")
    return v

@router.post("/vehicles", response_model=VehicleResponse, status_code=201)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db), user = Depends(require_permission("fleet", True))):
    if db.query(Vehicle).filter(Vehicle.registration_number == vehicle.registration_number).first():
        raise HTTPException(422, "registration_number already exists")
    v = Vehicle(**vehicle.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v

@router.put("/vehicles/{id}", response_model=VehicleResponse)
def update_vehicle(id: int, vehicle: VehicleUpdate, db: Session = Depends(get_db), user = Depends(require_permission("fleet", True))):
    v = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not v: raise HTTPException(404, "Vehicle not found")
    if vehicle.status in ["on_trip", "in_shop"]:
        raise HTTPException(422, "Setting status directly to on_trip/in_shop is rejected")
    for k, val in vehicle.model_dump(exclude_unset=True).items():
        setattr(v, k, val)
    db.commit()
    db.refresh(v)
    return v

@router.delete("/vehicles/{id}", status_code=204)
def delete_vehicle(id: int, db: Session = Depends(get_db), user = Depends(require_permission("fleet", True))):
    v = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not v: raise HTTPException(404, "Vehicle not found")
    if v.trips or v.maintenance_logs or v.fuel_logs or v.expenses:
        raise HTTPException(422, "Vehicle has trips/maintenance/fuel/expense history - use status retired instead of deleting")
    db.delete(v)
    db.commit()

@router.get("/drivers", response_model=list[DriverResponse])
def get_drivers(db: Session = Depends(get_db), user = Depends(require_permission("drivers"))):
    return db.query(Driver).all()

@router.get("/drivers/{id}", response_model=DriverResponse)
def get_driver(id: int, db: Session = Depends(get_db), user = Depends(require_permission("drivers"))):
    d = db.query(Driver).filter(Driver.id == id).first()
    if not d: raise HTTPException(404, "Driver not found")
    return d

@router.post("/drivers", response_model=DriverResponse, status_code=201)
def create_driver(driver: DriverCreate, db: Session = Depends(get_db), user = Depends(require_permission("drivers", True))):
    if db.query(Driver).filter(Driver.license_number == driver.license_number).first():
        raise HTTPException(422, "license_number already exists")
    d = Driver(**driver.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d

@router.put("/drivers/{id}", response_model=DriverResponse)
def update_driver(id: int, driver: DriverUpdate, db: Session = Depends(get_db), user = Depends(require_permission("drivers", True))):
    d = db.query(Driver).filter(Driver.id == id).first()
    if not d: raise HTTPException(404, "Driver not found")
    if driver.status == "on_trip":
        raise HTTPException(422, "Setting status directly to on_trip is rejected")
    for k, val in driver.model_dump(exclude_unset=True).items():
        setattr(d, k, val)
    db.commit()
    db.refresh(d)
    return d

@router.delete("/drivers/{id}", status_code=204)
def delete_driver(id: int, db: Session = Depends(get_db), user = Depends(require_permission("drivers", True))):
    d = db.query(Driver).filter(Driver.id == id).first()
    if not d: raise HTTPException(404, "Driver not found")
    if d.trips:
        raise HTTPException(422, "Driver has trip history - cannot delete, set status instead")
    db.delete(d)
    db.commit()

@router.get("/maintenance", response_model=list[MaintenanceResponse])
def get_maintenance(vehicle_id: int = None, status: str = None, db: Session = Depends(get_db), user = Depends(require_permission("fleet"))):
    q = db.query(MaintenanceLog)
    if vehicle_id: q = q.filter(MaintenanceLog.vehicle_id == vehicle_id)
    if status: q = q.filter(MaintenanceLog.status == status)
    return q.all()

@router.post("/maintenance", response_model=MaintenanceResponse, status_code=201)
def create_maintenance(maint: MaintenanceCreate, db: Session = Depends(get_db), user = Depends(require_permission("fleet", True))):
    v = db.query(Vehicle).filter(Vehicle.id == maint.vehicle_id).first()
    if not v: raise HTTPException(422, "vehicle_id not found")
    active_maint = db.query(MaintenanceLog).filter(MaintenanceLog.vehicle_id == v.id, MaintenanceLog.status == 'active').first()
    if active_maint: raise HTTPException(422, "Vehicle already has an active maintenance record open")
    m = MaintenanceLog(**maint.model_dump())
    db.add(m)
    v.status = "in_shop"
    db.commit()
    db.refresh(m)
    return m

@router.put("/maintenance/{id}", response_model=MaintenanceResponse)
def update_maintenance(id: int, maint: MaintenanceUpdate, db: Session = Depends(get_db), user = Depends(require_permission("fleet", True))):
    m = db.query(MaintenanceLog).filter(MaintenanceLog.id == id).first()
    if not m: raise HTTPException(404, "Maintenance record not found")
    if m.status == 'completed': raise HTTPException(422, "Record already completed")
    
    m.status = maint.status
    if m.status == "completed":
        from datetime import datetime
        m.closed_at = datetime.utcnow()
        v = m.vehicle
        if v.status != "retired":
            v.status = "available"
    db.commit()
    db.refresh(m)
    return m
