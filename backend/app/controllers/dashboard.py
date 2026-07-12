from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import require_permission, get_current_user
from app.schemas.dashboard import SettingUpdate, SettingResponse, DashboardResponse, AnalyticsResponse
from app.services.dashboard import DashboardService

router = APIRouter(prefix="/api")

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(vehicle_type: str = None, status: str = None, region: str = None, db: Session = Depends(get_db), user = Depends(get_current_user)):
    service = DashboardService(db)
    return service.get_dashboard_data(vehicle_type, status, region)

@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(from_date: str = None, to_date: str = None, db: Session = Depends(get_db), user = Depends(require_permission("analytics"))):
    service = DashboardService(db)
    return service.get_analytics_data(from_date, to_date)

@router.get("/settings", response_model=SettingResponse)
def get_settings(db: Session = Depends(get_db), user = Depends(require_permission("settings"))):
    service = DashboardService(db)
    return service.get_settings()

@router.put("/settings", response_model=SettingResponse)
def update_settings(sett: SettingUpdate, db: Session = Depends(get_db), user = Depends(require_permission("settings", True))):
    service = DashboardService(db)
    return service.update_settings(sett)
