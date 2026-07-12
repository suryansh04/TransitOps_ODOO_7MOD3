from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from app.models.domain import Vehicle, Driver, Trip, FuelLog, MaintenanceLog, OrgSetting

class DashboardRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_metrics(self, vehicle_type: str = None, status: str = None, region: str = None):
        def apply_filters(query):
            if vehicle_type: query = query.filter(or_(Vehicle.type.ilike(f"%{vehicle_type}%"), Vehicle.name_model.ilike(f"%{vehicle_type}%")))
            if region: query = query.filter(Vehicle.region == region)
            if status: query = query.filter(Vehicle.status == status)
            return query

        v_query = apply_filters(self.db.query(Vehicle))
        available_v = v_query.filter(Vehicle.status == 'available').count()
        shop_v = v_query.filter(Vehicle.status == 'in_shop').count()
        on_trip_v = v_query.filter(Vehicle.status == 'on_trip').count()
        retired_v = v_query.filter(Vehicle.status == 'retired').count()
        active_v = v_query.filter(Vehicle.status != 'retired').count()
        
        t_query = apply_filters(self.db.query(Trip).join(Vehicle))
        t_active = t_query.filter(Trip.status == 'dispatched').count()
        t_pending = t_query.filter(Trip.status == 'draft').count()
        
        d_query = apply_filters(self.db.query(Driver).join(
            Trip, and_(Trip.driver_id == Driver.id, Trip.status == 'dispatched')
        ).join(Vehicle, Trip.vehicle_id == Vehicle.id))
        d_duty = d_query.filter(Driver.status == 'on_trip').distinct().count()
        
        recent = (
            t_query.options(joinedload(Trip.vehicle), joinedload(Trip.driver))
            .order_by(Trip.created_at.desc())
            .limit(5)
            .all()
        )
        
        return {
            "available_v": available_v,
            "shop_v": shop_v,
            "on_trip_v": on_trip_v,
            "retired_v": retired_v,
            "active_v": active_v,
            "t_active": t_active,
            "t_pending": t_pending,
            "d_duty": d_duty,
            "recent": recent
        }

    def get_analytics_metrics(self, from_date: str = None, to_date: str = None):
        fuel_sum = self.db.query(func.sum(FuelLog.cost)).scalar() or 0
        maint_sum = self.db.query(func.sum(MaintenanceLog.cost)).scalar() or 0
        return {
            "fuel_sum": float(fuel_sum),
            "maint_sum": float(maint_sum)
        }
        
    def get_settings(self):
        return self.db.query(OrgSetting).first()

    def update_settings(self, depot_name=None, currency=None, distance_unit=None):
        s = self.db.query(OrgSetting).first()
        if not s:
            s = OrgSetting(depot_name="Gandhinagar Depot GJ", currency="INR", distance_unit="Kilometers")
            self.db.add(s)
        
        if depot_name: s.depot_name = depot_name
        if currency: s.currency = currency
        if distance_unit: s.distance_unit = distance_unit
        
        self.db.commit()
        self.db.refresh(s)
        return s
