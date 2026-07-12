from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import require_permission, get_current_user
from app.schemas.dashboard import SettingUpdate, SettingResponse
from app.models.domain import Vehicle, Driver, Trip, OrgSetting, FuelLog, MaintenanceLog
from sqlalchemy import func

router = APIRouter(prefix="/api")

@router.get("/dashboard")
def get_dashboard(vehicle_type: str = None, status: str = None, region: str = None, db: Session = Depends(get_db), user = Depends(get_current_user)):
    v_query = db.query(Vehicle)
    if vehicle_type: v_query = v_query.filter(Vehicle.type == vehicle_type)
    if status: v_query = v_query.filter(Vehicle.status == status)
    if region: v_query = v_query.filter(Vehicle.region == region)
    
    active_v = v_query.count()
    available_v = v_query.filter(Vehicle.status == 'available').count()
    shop_v = v_query.filter(Vehicle.status == 'in_shop').count()
    on_trip_v = v_query.filter(Vehicle.status == 'on_trip').count()
    retired_v = v_query.filter(Vehicle.status == 'retired').count()
    
    t_active = db.query(Trip).filter(Trip.status == 'dispatched').count()
    t_pending = db.query(Trip).filter(Trip.status == 'draft').count()
    
    d_duty = db.query(Driver).filter(Driver.status == 'on_trip').count()
    
    utilization = (on_trip_v / active_v * 100) if active_v else 0
    
    recent = db.query(Trip).filter(Trip.status == 'dispatched').order_by(Trip.dispatched_at.desc()).limit(5).all()
    recent_formatted = [{"trip_code": t.trip_code, "vehicle_registration_number": t.vehicle.registration_number, "driver_name": t.driver.name, "status": t.status, "eta": "45 min"} for t in recent]
    
    return {
        "active_vehicles": active_v,
        "available_vehicles": available_v,
        "vehicles_in_maintenance": shop_v,
        "active_trips": t_active,
        "pending_trips": t_pending,
        "drivers_on_duty": d_duty,
        "fleet_utilization_percent": round(utilization, 1),
        "recent_trips": recent_formatted,
        "vehicle_status_breakdown": {
            "available": available_v,
            "on_trip": on_trip_v,
            "in_shop": shop_v,
            "retired": retired_v
        }
    }

@router.get("/analytics")
def get_analytics(from_date: str = None, to_date: str = None, db: Session = Depends(get_db), user = Depends(require_permission("analytics"))):
    fuel_sum = db.query(func.sum(FuelLog.cost)).scalar() or 0
    maint_sum = db.query(func.sum(MaintenanceLog.cost)).scalar() or 0
    op_cost = float(fuel_sum) + float(maint_sum)
    
    # Mocking Monthly Revenue for Hackathon UI display purposes
    return {
        "fuel_efficiency_km_per_l": 8.4,
        "fleet_utilization_percent": 81,
        "operational_cost": op_cost,
        "vehicle_roi_percent": 14.2,
        "monthly_revenue": [
            { "month": "2026-01", "revenue": 45000 },
            { "month": "2026-02", "revenue": 52000 }
        ],
        "top_costliest_vehicles": [
            { "vehicle_id": 2, "registration_number": "TRUCK-11", "total_cost": 42500 },
            { "vehicle_id": 3, "registration_number": "MINI-03", "total_cost": 18200 },
            { "vehicle_id": 1, "registration_number": "VAN-05", "total_cost": 5300 }
        ]
    }

@router.get("/settings", response_model=SettingResponse)
def get_settings(db: Session = Depends(get_db), user = Depends(require_permission("settings"))):
    s = db.query(OrgSetting).first()
    if not s:
        s = OrgSetting(depot_name="Gandhinagar Depot GJ", currency="INR", distance_unit="Kilometers")
        db.add(s)
        db.commit()
    return s

@router.put("/settings", response_model=SettingResponse)
def update_settings(sett: SettingUpdate, db: Session = Depends(get_db), user = Depends(require_permission("settings", True))):
    s = db.query(OrgSetting).first()
    if not s:
        s = OrgSetting(depot_name="Gandhinagar Depot GJ", currency="INR", distance_unit="Kilometers")
        db.add(s)
    
    if sett.depot_name: s.depot_name = sett.depot_name
    if sett.currency: s.currency = sett.currency
    if sett.distance_unit: s.distance_unit = sett.distance_unit
    
    db.commit()
    db.refresh(s)
    return s
