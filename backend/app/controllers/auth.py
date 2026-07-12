from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import LoginRequest, TokenResponse, UserResponse
from app.services.auth import AuthService
from app.core.auth import get_current_user
from app.repositories.user import RolePermissionRepository

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(login_req: LoginRequest, db: Session = Depends(get_db)):
    return AuthService.authenticate_user(db, login_req)

@router.get("/me", response_model=UserResponse)
def get_me(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    permissions = RolePermissionRepository.get_permissions_by_role(db, current_user.role)
    user_resp = UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        permissions=permissions
    )
    return user_resp
