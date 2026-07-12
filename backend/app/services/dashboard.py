from sqlalchemy.orm import Session
from datetime import datetime, date
from fastapi import HTTPException
from app.repositories.dashboard import DashboardRepository

class DashboardService:
    def __init__(self, db: Session):
        self.repo = DashboardRepository(db)

    def get_dashboard_data(self, vehicle_type: str = None, status: str = None, region: str = None):
        data = self.repo.get_dashboard_metrics(vehicle_type, status, region)
        
        utilization = (data["on_trip_v"] / data["active_v"] * 100) if data["active_v"] else 0
        
        recent_formatted = []
        for t in data["recent"]:
            eta_str = "N/A"
            if t.eta:
                delta = t.eta - datetime.utcnow()
                minutes = int(delta.total_seconds() / 60)
                if minutes > 60:
                    eta_str = f"{minutes // 60} hr {minutes % 60} min"
                elif minutes > 0:
                    eta_str = f"{minutes} min"
                else:
                    eta_str = "Arrived"

            recent_formatted.append({
                "trip_code": t.trip_code, 
                "vehicle_registration_number": t.vehicle.registration_number, 
                "vehicle_name_model": t.vehicle.name_model,
                "vehicle_type": t.vehicle.type,
                "driver_name": t.driver.name, 
                "status": t.status, 
                "eta": eta_str
            })

        return {
            "active_vehicles": data["active_v"],
            "available_vehicles": data["available_v"],
            "vehicles_in_maintenance": data["shop_v"],
            "active_trips": data["t_active"],
            "pending_trips": data["t_pending"],
            "drivers_on_duty": data["d_duty"],
            "fleet_utilization_percent": round(utilization, 1),
            "recent_trips": recent_formatted,
            "vehicle_status_breakdown": {
                "available": data["available_v"],
                "on_trip": data["on_trip_v"],
                "in_shop": data["shop_v"],
                "retired": data["retired_v"]
            }
        }
    
    def get_analytics_data(self, from_date: str = None, to_date: str = None):
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

        data = self.repo.get_analytics_metrics(from_dt, to_dt)

        return {
            "fuel_efficiency_km_per_l": data["fuel_efficiency_km_per_l"],
            "fleet_utilization_percent": data["fleet_utilization_percent"],
            "operational_cost": data["operational_cost"],
            "vehicle_roi_percent": data["vehicle_roi_percent"],
            "monthly_revenue": data["monthly_revenue"],
            "top_costliest_vehicles": data["top_costliest_vehicles"],
        }
        
    def get_settings(self):
        s = self.repo.get_settings()
        if not s:
            return self.repo.update_settings()
        return s
        
    def update_settings(self, sett_update):
        return self.repo.update_settings(
            depot_name=sett_update.depot_name,
            currency=sett_update.currency,
            distance_unit=sett_update.distance_unit
        )
