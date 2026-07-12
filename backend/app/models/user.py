from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, CheckConstraint, UniqueConstraint
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(160), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    is_active = Column(Boolean, default=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "role IN ('fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst')",
            name="check_valid_role"
        ),
    )

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(30), nullable=False)
    module = Column(String(30), nullable=False)
    access_level = Column(String(10), nullable=False, default='none')

    __table_args__ = (
        UniqueConstraint('role', 'module', name='uix_role_module'),
        CheckConstraint(
            "access_level IN ('none', 'view', 'full')",
            name="check_valid_access_level"
        ),
    )
