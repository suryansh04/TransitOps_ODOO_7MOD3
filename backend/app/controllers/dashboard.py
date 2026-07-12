from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import require_permission
from app.schemas.dashboard import SettingUpdate, SettingResponse
from app.models.domain import Vehicle, Driver, Trip, OrgSetting, FuelLog, MaintenanceLog, Expense
from sqlalchemy import func
from datetime import date

router = APIRouter(prefix="/api")

@router.get("/dashboard")
def get_dashboard(vehicle_type: str = None, status: str = None, region: str = None, db: Session = Depends(get_db), user = Depends(require_permission("fleet"))):
    # Simplified mock for the hackathon but accurately reflecting db counts
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
    def parse_date(value: str, field_name: str):
        if value is None:
            return None
        try:
            return date.fromisoformat(value)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid {field_name}. Use YYYY-MM-DD format") from exc

    from_dt = parse_date(from_date, "from_date")
    to_dt = parse_date(to_date, "to_date")
    if from_dt and to_dt and from_dt > to_dt:
        raise HTTPException(status_code=422, detail="from_date cannot be after to_date")

    trips_query = db.query(Trip).filter(Trip.status == "completed")
    fuel_query = db.query(FuelLog)
    maintenance_query = db.query(MaintenanceLog)
    expenses_query = db.query(Expense)

    if from_dt:
        trips_query = trips_query.filter(func.date(Trip.completed_at) >= from_dt)
        fuel_query = fuel_query.filter(FuelLog.log_date >= from_dt)
        maintenance_query = maintenance_query.filter(MaintenanceLog.service_date >= from_dt)
        expenses_query = expenses_query.filter(Expense.expense_date >= from_dt)
    if to_dt:
        trips_query = trips_query.filter(func.date(Trip.completed_at) <= to_dt)
        fuel_query = fuel_query.filter(FuelLog.log_date <= to_dt)
        maintenance_query = maintenance_query.filter(MaintenanceLog.service_date <= to_dt)
        expenses_query = expenses_query.filter(Expense.expense_date <= to_dt)

    fuel_sum = float(fuel_query.with_entities(func.sum(FuelLog.cost)).scalar() or 0)
    maintenance_sum = float(maintenance_query.with_entities(func.sum(MaintenanceLog.cost)).scalar() or 0)
    operational_cost = fuel_sum + maintenance_sum

    total_distance = float(trips_query.with_entities(func.sum(Trip.actual_distance_km)).scalar() or 0)
    total_fuel_liters = float(trips_query.with_entities(func.sum(Trip.fuel_consumed_liters)).scalar() or 0)
    fuel_efficiency = round(total_distance / total_fuel_liters, 1) if total_fuel_liters else 0.0

    completed_trip_rows = trips_query.with_entities(Trip.completed_at, Trip.revenue_amount).all()
    monthly_revenue_map = {}
    for completed_at, revenue_amount in completed_trip_rows:
        if not completed_at or revenue_amount is None:
            continue
        month_key = completed_at.strftime("%Y-%m")
        monthly_revenue_map[month_key] = monthly_revenue_map.get(month_key, 0.0) + float(revenue_amount)
    monthly_revenue = [
        {"month": month, "revenue": round(value, 2)}
        for month, value in sorted(monthly_revenue_map.items())
    ]

    vehicle_cost_map = {}

    fuel_rows = fuel_query.with_entities(FuelLog.vehicle_id, func.sum(FuelLog.cost)).group_by(FuelLog.vehicle_id).all()
    for vehicle_id, total_cost in fuel_rows:
        vehicle_cost_map[vehicle_id] = vehicle_cost_map.get(vehicle_id, 0.0) + float(total_cost or 0)

    maintenance_rows = maintenance_query.with_entities(MaintenanceLog.vehicle_id, func.sum(MaintenanceLog.cost)).group_by(MaintenanceLog.vehicle_id).all()
    for vehicle_id, total_cost in maintenance_rows:
        vehicle_cost_map[vehicle_id] = vehicle_cost_map.get(vehicle_id, 0.0) + float(total_cost or 0)

    expense_rows = expenses_query.with_entities(
        Expense.vehicle_id,
        func.sum(Expense.toll_amount + Expense.other_amount + Expense.maintenance_linked_cost),
    ).group_by(Expense.vehicle_id).all()
    for vehicle_id, total_cost in expense_rows:
        vehicle_cost_map[vehicle_id] = vehicle_cost_map.get(vehicle_id, 0.0) + float(total_cost or 0)

    top_vehicle_ids = [vehicle_id for vehicle_id, _ in sorted(vehicle_cost_map.items(), key=lambda item: item[1], reverse=True)[:3]]
    registration_by_id = {
        vehicle.id: vehicle.registration_number
        for vehicle in db.query(Vehicle).filter(Vehicle.id.in_(top_vehicle_ids)).all()
    } if top_vehicle_ids else {}

    top_costliest_vehicles = [
        {
            "vehicle_id": vehicle_id,
            "registration_number": registration_by_id.get(vehicle_id, f"VEH-{vehicle_id}"),
            "total_cost": round(total_cost, 2),
        }
        for vehicle_id, total_cost in sorted(vehicle_cost_map.items(), key=lambda item: item[1], reverse=True)[:3]
    ]

    total_revenue = float(trips_query.with_entities(func.sum(Trip.revenue_amount)).scalar() or 0)
    acquisition_cost_sum = float(db.query(func.sum(Vehicle.acquisition_cost)).scalar() or 0)
    vehicle_roi_percent = round(((total_revenue - operational_cost) / acquisition_cost_sum) * 100, 1) if acquisition_cost_sum else 0.0

    active_vehicles = db.query(Vehicle).filter(Vehicle.status != "retired").count()
    on_trip_vehicles = db.query(Vehicle).filter(Vehicle.status == "on_trip").count()
    fleet_utilization_percent = round((on_trip_vehicles / active_vehicles) * 100, 1) if active_vehicles else 0.0

    return {
        "fuel_efficiency_km_per_l": fuel_efficiency,
        "fleet_utilization_percent": fleet_utilization_percent,
        "operational_cost": round(operational_cost, 2),
        "vehicle_roi_percent": vehicle_roi_percent,
        "monthly_revenue": monthly_revenue,
        "top_costliest_vehicles": top_costliest_vehicles,
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
