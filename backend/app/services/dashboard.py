from sqlalchemy.orm import Session
from datetime import datetime
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
        data = self.repo.get_analytics_metrics(from_date, to_date)
        op_cost = data["fuel_sum"] + data["maint_sum"]
        
        return {
            "fuel_efficiency_km_per_l": 8.4,
            "fleet_utilization_percent": 81.0,
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
