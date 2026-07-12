from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from app.models.domain import Vehicle, Driver, Trip, FuelLog, MaintenanceLog, OrgSetting, Expense

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

    def get_analytics_metrics(self, from_date = None, to_date = None):
        trips_query = self.db.query(Trip).filter(Trip.status == 'completed')
        fuel_query = self.db.query(FuelLog)
        maintenance_query = self.db.query(MaintenanceLog)
        expenses_query = self.db.query(Expense)

        if from_date:
            trips_query = trips_query.filter(func.date(Trip.completed_at) >= from_date)
            fuel_query = fuel_query.filter(FuelLog.log_date >= from_date)
            maintenance_query = maintenance_query.filter(MaintenanceLog.service_date >= from_date)
            expenses_query = expenses_query.filter(Expense.expense_date >= from_date)

        if to_date:
            trips_query = trips_query.filter(func.date(Trip.completed_at) <= to_date)
            fuel_query = fuel_query.filter(FuelLog.log_date <= to_date)
            maintenance_query = maintenance_query.filter(MaintenanceLog.service_date <= to_date)
            expenses_query = expenses_query.filter(Expense.expense_date <= to_date)

        fuel_sum = float(fuel_query.with_entities(func.sum(FuelLog.cost)).scalar() or 0)
        maint_sum = float(maintenance_query.with_entities(func.sum(MaintenanceLog.cost)).scalar() or 0)
        operational_cost = fuel_sum + maint_sum

        total_distance = float(trips_query.with_entities(func.sum(Trip.actual_distance_km)).scalar() or 0)
        total_fuel_liters = float(trips_query.with_entities(func.sum(Trip.fuel_consumed_liters)).scalar() or 0)
        fuel_efficiency = round(total_distance / total_fuel_liters, 1) if total_fuel_liters else 0.0

        completed_trip_rows = trips_query.with_entities(Trip.completed_at, Trip.revenue_amount).all()
        monthly_revenue_map = {}
        for completed_at, revenue_amount in completed_trip_rows:
            if not completed_at or revenue_amount is None:
                continue
            month_key = completed_at.strftime('%Y-%m')
            monthly_revenue_map[month_key] = monthly_revenue_map.get(month_key, 0.0) + float(revenue_amount)

        monthly_revenue = [
            {'month': month, 'revenue': round(value, 2)}
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

        top_vehicle_ids = [
            vehicle_id
            for vehicle_id, _ in sorted(vehicle_cost_map.items(), key=lambda item: item[1], reverse=True)[:3]
        ]

        registration_by_id = {
            vehicle.id: vehicle.registration_number
            for vehicle in self.db.query(Vehicle).filter(Vehicle.id.in_(top_vehicle_ids)).all()
        } if top_vehicle_ids else {}

        top_costliest_vehicles = [
            {
                'vehicle_id': vehicle_id,
                'registration_number': registration_by_id.get(vehicle_id, f'VEH-{vehicle_id}'),
                'total_cost': round(total_cost, 2),
            }
            for vehicle_id, total_cost in sorted(vehicle_cost_map.items(), key=lambda item: item[1], reverse=True)[:3]
        ]

        total_revenue = float(trips_query.with_entities(func.sum(Trip.revenue_amount)).scalar() or 0)
        acquisition_cost_sum = float(self.db.query(func.sum(Vehicle.acquisition_cost)).scalar() or 0)
        vehicle_roi_percent = round(((total_revenue - operational_cost) / acquisition_cost_sum) * 100, 1) if acquisition_cost_sum else 0.0

        active_vehicles = self.db.query(Vehicle).filter(Vehicle.status != 'retired').count()
        on_trip_vehicles = self.db.query(Vehicle).filter(Vehicle.status == 'on_trip').count()
        fleet_utilization_percent = round((on_trip_vehicles / active_vehicles) * 100, 1) if active_vehicles else 0.0

        return {
            'fuel_efficiency_km_per_l': fuel_efficiency,
            'fleet_utilization_percent': fleet_utilization_percent,
            'operational_cost': round(operational_cost, 2),
            'vehicle_roi_percent': vehicle_roi_percent,
            'monthly_revenue': monthly_revenue,
            'top_costliest_vehicles': top_costliest_vehicles,
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
