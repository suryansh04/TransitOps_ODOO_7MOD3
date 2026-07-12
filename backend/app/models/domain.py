from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(30), unique=True, nullable=False)
    name_model = Column(String(80), nullable=False)
    type = Column(String(30), nullable=False)
    max_load_capacity_kg = Column(Numeric(10, 2), nullable=False)
    odometer_km = Column(Numeric(12, 2), default=0)
    acquisition_cost = Column(Numeric(14, 2), nullable=False)
    status = Column(String(20), nullable=False, default='available')
    region = Column(String(60), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    license_number = Column(String(40), unique=True, nullable=False)
    license_category = Column(String(20), nullable=False)
    license_expiry_date = Column(Date, nullable=False)
    contact_number = Column(String(20), nullable=False)
    safety_score = Column(Numeric(5, 2), default=100)
    trips_assigned = Column(Integer, default=0)
    trips_completed = Column(Integer, default=0)
    status = Column(String(20), nullable=False, default='available')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trips = relationship("Trip", back_populates="driver")

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    trip_code = Column(String(20), unique=True, nullable=False)
    source = Column(String(120), nullable=False)
    destination = Column(String(120), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    cargo_weight_kg = Column(Numeric(10, 2), nullable=False)
    planned_distance_km = Column(Numeric(10, 2), nullable=False)
    actual_distance_km = Column(Numeric(10, 2), nullable=True)
    final_odometer_km = Column(Numeric(12, 2), nullable=True)
    fuel_consumed_liters = Column(Numeric(10, 2), nullable=True)
    revenue_amount = Column(Numeric(14, 2), nullable=True)
    status = Column(String(20), nullable=False, default='draft')
    eta = Column(DateTime, nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    fuel_logs = relationship("FuelLog", back_populates="trip")
    expenses = relationship("Expense", back_populates="trip")

class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    service_type = Column(String(80), nullable=False)
    cost = Column(Numeric(12, 2), nullable=False)
    service_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default='active')
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")

class FuelLog(Base):
    __tablename__ = "fuel_logs"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    log_date = Column(Date, nullable=False)
    liters = Column(Numeric(10, 2), nullable=False)
    cost = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")
    trip = relationship("Trip", back_populates="fuel_logs")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    toll_amount = Column(Numeric(12, 2), default=0)
    other_amount = Column(Numeric(12, 2), default=0)
    maintenance_linked_cost = Column(Numeric(12, 2), default=0)
    expense_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="expenses")
    trip = relationship("Trip", back_populates="expenses")

class OrgSetting(Base):
    __tablename__ = "org_settings"
    id = Column(Integer, primary_key=True, index=True)
    depot_name = Column(String(120), nullable=False)
    currency = Column(String(10), default='INR')
    distance_unit = Column(String(20), default='Kilometers')
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
