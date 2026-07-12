import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import JWT_SECRET, JWT_ALGORITHM
from app.database import get_db
from app.repositories.user import UserRepository, RolePermissionRepository

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing sub claim"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user = UserRepository.get_by_id(db, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    user.permissions = RolePermissionRepository.get_permissions_by_role(db, user.role)
    return user

def require_permission(module: str, require_full: bool = False):
    def checker(current_user = Depends(get_current_user)):
        level = current_user.permissions.get(module, 'none')
        if level == 'none' or (require_full and level != 'full'):
            raise HTTPException(status_code=403, detail=f"Caller's role lacks access to {module}")
        return current_user
    return checker
