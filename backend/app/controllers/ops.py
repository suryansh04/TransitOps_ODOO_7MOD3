from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import require_permission, get_current_user
from app.schemas.ops import TripCreate, TripDispatch, TripComplete, TripResponse, FuelLogCreate, FuelLogResponse, ExpenseCreate, ExpenseResponse
from app.models.domain import Trip, Vehicle, Driver, FuelLog, Expense, MaintenanceLog
from datetime import datetime, date

router = APIRouter(prefix="/api")

@router.get("/trips", response_model=list[TripResponse])
def get_trips(status: str = None, db: Session = Depends(get_db), user = Depends(require_permission("trips"))):
    q = db.query(Trip)
    if status: q = q.filter(Trip.status == status)
    return q.all()

@router.get("/trips/{id}", response_model=TripResponse)
def get_trip(id: int, db: Session = Depends(get_db), user = Depends(require_permission("trips"))):
    t = db.query(Trip).filter(Trip.id == id).first()
    if not t: raise HTTPException(404, "Trip not found")
    return t

@router.post("/trips", response_model=TripResponse, status_code=201)
def create_trip(trip: TripCreate, db: Session = Depends(get_db), user = Depends(require_permission("trips", True))):
    v = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    d = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    if not v or not d: raise HTTPException(422, "vehicle_id or driver_id not found")
    
    trip_code = f"TR{db.query(Trip).count() + 1:03d}"
    t = Trip(**trip.model_dump(), trip_code=trip_code, created_by=user.id)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.post("/trips/{id}/dispatch", response_model=TripResponse)
def dispatch_trip(id: int, dispatch: TripDispatch, db: Session = Depends(get_db), user = Depends(require_permission("trips", True))):
    t = db.query(Trip).filter(Trip.id == id).first()
    if not t: raise HTTPException(404, "Trip not found")
    if t.status != "draft": raise HTTPException(422, "Trip is not in draft status")
    
    v = t.vehicle
    d = t.driver
    if float(t.cargo_weight_kg) > float(v.max_load_capacity_kg): raise HTTPException(422, "cargo_weight_kg exceeds vehicle's max_load_capacity_kg")
    if v.status != "available": raise HTTPException(422, "Vehicle status is not available")
    if d.status != "available": raise HTTPException(422, "Driver status is not available")
    if d.license_expiry_date < date.today(): raise HTTPException(422, "Driver's license_expiry_date has passed")

    t.eta = dispatch.eta
    t.status = "dispatched"
    t.dispatched_at = datetime.utcnow()
    v.status = "on_trip"
    d.status = "on_trip"
    d.trips_assigned += 1
    db.commit()
    db.refresh(t)
    return t

@router.post("/trips/{id}/complete", response_model=TripResponse)
def complete_trip(id: int, comp: TripComplete, db: Session = Depends(get_db), user = Depends(require_permission("trips", True))):
    t = db.query(Trip).filter(Trip.id == id).first()
    if not t: raise HTTPException(404, "Trip not found")
    if t.status != "dispatched": raise HTTPException(422, "Trip is not in dispatched status")

    t.final_odometer_km = comp.final_odometer_km
    t.actual_distance_km = comp.actual_distance_km
    t.fuel_consumed_liters = comp.fuel_consumed_liters
    t.status = "completed"
    t.completed_at = datetime.utcnow()
    
    v = t.vehicle
    v.status = "available"
    v.odometer_km = comp.final_odometer_km
    
    d = t.driver
    d.status = "available"
    d.trips_completed += 1

    fuel = FuelLog(vehicle_id=v.id, trip_id=t.id, liters=comp.fuel_consumed_liters, cost=comp.fuel_cost, log_date=date.today())
    db.add(fuel)
    db.commit()
    db.refresh(t)
    return t

@router.post("/trips/{id}/cancel", response_model=TripResponse)
def cancel_trip(id: int, db: Session = Depends(get_db), user = Depends(require_permission("trips", True))):
    t = db.query(Trip).filter(Trip.id == id).first()
    if not t: raise HTTPException(404, "Trip not found")
    if t.status != "dispatched": raise HTTPException(422, "Trip is not in dispatched status")
    
    t.status = "cancelled"
    t.cancelled_at = datetime.utcnow()
    t.vehicle.status = "available"
    t.driver.status = "available"
    db.commit()
    db.refresh(t)
    return t

@router.get("/fuel-logs", response_model=list[FuelLogResponse])
def get_fuel_logs(vehicle_id: int = None, trip_id: int = None, db: Session = Depends(get_db), user = Depends(require_permission("fuel_expenses"))):
    q = db.query(FuelLog)
    if vehicle_id: q = q.filter(FuelLog.vehicle_id == vehicle_id)
    if trip_id: q = q.filter(FuelLog.trip_id == trip_id)
    return q.all()

@router.post("/fuel-logs", response_model=FuelLogResponse, status_code=201)
def create_fuel_log(log: FuelLogCreate, db: Session = Depends(get_db), user = Depends(require_permission("fuel_expenses", True))):
    if not db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first(): raise HTTPException(422, "vehicle_id not found")
    f = FuelLog(**log.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

@router.get("/expenses", response_model=list[ExpenseResponse])
def get_expenses(vehicle_id: int = None, trip_id: int = None, db: Session = Depends(get_db), user = Depends(require_permission("fuel_expenses"))):
    q = db.query(Expense)
    if vehicle_id: q = q.filter(Expense.vehicle_id == vehicle_id)
    if trip_id: q = q.filter(Expense.trip_id == trip_id)
    res = []
    for e in q.all():
        e.total_amount = float(e.toll_amount or 0) + float(e.other_amount or 0) + float(e.maintenance_linked_cost or 0)
        res.append(e)
    return res

@router.post("/expenses", response_model=ExpenseResponse, status_code=201)
def create_expense(exp: ExpenseCreate, db: Session = Depends(get_db), user = Depends(require_permission("fuel_expenses", True))):
    if not db.query(Vehicle).filter(Vehicle.id == exp.vehicle_id).first(): raise HTTPException(422, "vehicle_id not found")
    
    ml = db.query(MaintenanceLog).filter(
        MaintenanceLog.vehicle_id == exp.vehicle_id, 
        MaintenanceLog.service_date == exp.expense_date
    ).first()
    
    e = Expense(**exp.model_dump())
    if ml:
        e.maintenance_linked_cost = ml.cost
        
    db.add(e)
    db.commit()
    db.refresh(e)
    e.total_amount = float(e.toll_amount or 0) + float(e.other_amount or 0) + float(e.maintenance_linked_cost or 0)
    return e
