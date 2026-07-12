import os
import sys
from datetime import datetime, timedelta, date

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models.user import User, RolePermission
from app.models.domain import Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, OrgSetting
from app.services.auth import AuthService

def seed():
    # Ensure all tables defined in models exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    
    # 1. Users & Permissions
    if not db.query(User).first():
        print("Seeding role permissions...")
        permissions_data = [
            # fleet_manager
            ("fleet_manager", "fleet", "full"),
            ("fleet_manager", "drivers", "full"),
            ("fleet_manager", "trips", "none"),
            ("fleet_manager", "fuel_expenses", "none"),
            ("fleet_manager", "analytics", "full"),
            ("fleet_manager", "settings", "full"),
            
            # dispatcher
            ("dispatcher", "fleet", "view"),
            ("dispatcher", "drivers", "none"),
            ("dispatcher", "trips", "full"),
            ("dispatcher", "fuel_expenses", "none"),
            ("dispatcher", "analytics", "none"),
            ("dispatcher", "settings", "view"),
            
            # safety_officer
            ("safety_officer", "fleet", "none"),
            ("safety_officer", "drivers", "full"),
            ("safety_officer", "trips", "view"),
            ("safety_officer", "fuel_expenses", "none"),
            ("safety_officer", "analytics", "none"),
            ("safety_officer", "settings", "view"),
            
            # financial_analyst
            ("financial_analyst", "fleet", "view"),
            ("financial_analyst", "drivers", "none"),
            ("financial_analyst", "trips", "none"),
            ("financial_analyst", "fuel_expenses", "full"),
            ("financial_analyst", "analytics", "full"),
            ("financial_analyst", "settings", "view"),
        ]
        
        for role, module, access in permissions_data:
            perm = RolePermission(role=role, module=module, access_level=access)
            db.add(perm)

        print("Seeding users...")
        users_data = [
            ("Fleet Manager", "fleet@transitops.in", "password123", "fleet_manager"),
            ("Dispatcher Raven", "raven@transitops.in", "password123", "dispatcher"),
            ("Safety Officer", "safety@transitops.in", "password123", "safety_officer"),
            ("Financial Analyst", "finance@transitops.in", "password123", "financial_analyst"),
            ("Test Fleet", "testfleet@transitops.in", "password123", "fleet_manager"),
        ]
        
        for name, email, password, role in users_data:
            user = User(
                name=name,
                email=email,
                password_hash=AuthService.hash_password(password),
                role=role,
            )
            db.add(user)

        db.commit()
    else:
        print("Users already seeded.")

    # 2. Org Settings
    if not db.query(OrgSetting).first():
        print("Seeding org settings...")
        db.add(OrgSetting(depot_name="TransitOps Main Depot", currency="INR", distance_unit="Kilometers"))
        db.commit()
    else:
        print("Org settings already seeded.")

    # 3. Vehicles
    if not db.query(Vehicle).first():
        print("Seeding vehicles...")
        vehicles_data = [
            Vehicle(registration_number="MH-01-AB-1234", name_model="Tata Signa 4225.T", type="Heavy Truck", max_load_capacity_kg=25000, odometer_km=145000, acquisition_cost=3500000, status="available", region="Mumbai"),
            Vehicle(registration_number="MH-02-CD-5678", name_model="Ashok Leyland Ecomet", type="Medium Truck", max_load_capacity_kg=12000, odometer_km=85000, acquisition_cost=2000000, status="on_trip", region="Pune"),
            Vehicle(registration_number="DL-01-XY-9012", name_model="Mahindra Bolero Maxi", type="Light Truck", max_load_capacity_kg=1500, odometer_km=42000, acquisition_cost=800000, status="in_shop", region="Delhi"),
            Vehicle(registration_number="GJ-01-KL-3456", name_model="Tata Ace Gold", type="Mini Truck", max_load_capacity_kg=750, odometer_km=12000, acquisition_cost=500000, status="available", region="Ahmedabad"),
        ]
        db.add_all(vehicles_data)
        db.commit()
    else:
        print("Vehicles already seeded.")

    # 4. Drivers
    if not db.query(Driver).first():
        print("Seeding drivers...")
        drivers_data = [
            Driver(name="Rajesh Kumar", license_number="MH-1990-123456", license_category="HMV", license_expiry_date=date(2028, 5, 10), contact_number="+91 9876543210", safety_score=95.5, trips_assigned=120, trips_completed=118, status="available"),
            Driver(name="Suresh Singh", license_number="MH-1995-654321", license_category="LMV", license_expiry_date=date(2027, 8, 22), contact_number="+91 9876543211", safety_score=88.0, trips_assigned=85, trips_completed=85, status="on_trip"),
            Driver(name="Amit Patel", license_number="DL-1988-112233", license_category="HMV", license_expiry_date=date(2025, 1, 15), contact_number="+91 9876543212", safety_score=92.0, trips_assigned=200, trips_completed=195, status="off_duty"),
        ]
        db.add_all(drivers_data)
        db.commit()
    else:
        print("Drivers already seeded.")

    # 5. Trips
    if not db.query(Trip).first():
        print("Seeding trips...")
        v1 = db.query(Vehicle).filter(Vehicle.registration_number == "MH-01-AB-1234").first()
        d1 = db.query(Driver).filter(Driver.name == "Rajesh Kumar").first()
        
        v2 = db.query(Vehicle).filter(Vehicle.registration_number == "MH-02-CD-5678").first()
        d2 = db.query(Driver).filter(Driver.name == "Suresh Singh").first()
        
        u1 = db.query(User).filter(User.role == "dispatcher").first()

        if v1 and d1 and v2 and d2 and u1:
            trips_data = [
                Trip(trip_code="TRP-2026-001", source="Mumbai", destination="Pune", vehicle_id=v1.id, driver_id=d1.id, cargo_weight_kg=15000, planned_distance_km=150, actual_distance_km=155, final_odometer_km=145155, fuel_consumed_liters=40, revenue_amount=25000, status="completed", dispatched_at=datetime.utcnow() - timedelta(days=2), completed_at=datetime.utcnow() - timedelta(days=1), created_by=u1.id),
                Trip(trip_code="TRP-2026-002", source="Pune", destination="Nashik", vehicle_id=v2.id, driver_id=d2.id, cargo_weight_kg=8000, planned_distance_km=210, status="dispatched", eta=datetime.utcnow() + timedelta(hours=4), dispatched_at=datetime.utcnow() - timedelta(hours=1), created_by=u1.id),
                Trip(trip_code="TRP-2026-003", source="Mumbai", destination="Surat", vehicle_id=v1.id, driver_id=d1.id, cargo_weight_kg=20000, planned_distance_km=280, status="draft", created_by=u1.id)
            ]
            db.add_all(trips_data)
            db.commit()
    else:
        print("Trips already seeded.")

    # 6. Maintenance Logs
    if not db.query(MaintenanceLog).first():
        print("Seeding maintenance...")
        v3 = db.query(Vehicle).filter(Vehicle.registration_number == "DL-01-XY-9012").first()
        if v3:
            m_logs = [
                MaintenanceLog(vehicle_id=v3.id, service_type="Engine Overhaul", cost=45000, service_date=date(2026, 7, 10), status="active")
            ]
            db.add_all(m_logs)
            db.commit()
    else:
        print("Maintenance already seeded.")

    # 7. Fuel & Expenses
    if not db.query(FuelLog).first():
        print("Seeding fuel and expenses...")
        v1 = db.query(Vehicle).filter(Vehicle.registration_number == "MH-01-AB-1234").first()
        t1 = db.query(Trip).filter(Trip.trip_code == "TRP-2026-001").first()
        
        if v1 and t1:
            fuel_logs = [
                FuelLog(vehicle_id=v1.id, trip_id=t1.id, log_date=date(2026, 7, 10), liters=40, cost=3800)
            ]
            db.add_all(fuel_logs)
            
            expenses = [
                Expense(trip_id=t1.id, vehicle_id=v1.id, toll_amount=800, other_amount=250, maintenance_linked_cost=0, expense_date=date(2026, 7, 11))
            ]
            db.add_all(expenses)
            db.commit()
    else:
        print("Fuel and expenses already seeded.")

    db.close()
    print("Seed complete.")

if __name__ == "__main__":
    seed()
