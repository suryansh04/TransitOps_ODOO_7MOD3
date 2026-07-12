import os
import hashlib
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.repositories.user import UserRepository, RolePermissionRepository
from app.schemas.user import LoginRequest, TokenResponse, UserResponse
from app.models.user import User

class AuthService:
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        try:
            salt, stored_hash = hashed.split('.')
            new_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return new_hash.hex() == stored_hash
        except ValueError:
            return False

    @staticmethod
    def hash_password(password: str) -> str:
        salt = os.urandom(16).hex()
        hash_bytes = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"{salt}.{hash_bytes.hex()}"

    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return encoded_jwt

    @classmethod
    def authenticate_user(cls, db: Session, login_req: LoginRequest) -> TokenResponse:
        user = UserRepository.get_by_email(db, login_req.email)
        
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        if user.role != login_req.role:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="role in request doesn't match the account's actual role")

        if user.locked_until and user.locked_until > datetime.utcnow():
            ist_time = user.locked_until + timedelta(hours=5, minutes=30)
            formatted_ist = ist_time.strftime("%Y-%m-%d %I:%M %p IST")
            raise HTTPException(
                status_code=423,
                detail=f"Account locked until {formatted_ist}"
            )

        if not cls.verify_password(login_req.password, user.password_hash):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=15)
                UserRepository.update(db, user)
                ist_time = user.locked_until + timedelta(hours=5, minutes=30)
                formatted_ist = ist_time.strftime("%Y-%m-%d %I:%M %p IST")
                raise HTTPException(status_code=423, detail=f"Account locked until {formatted_ist}")
            
            UserRepository.update(db, user)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        # Successful login
        user.failed_login_attempts = 0
        user.locked_until = None
        UserRepository.update(db, user)

        access_token = cls.create_access_token(data={"sub": str(user.id)})
        permissions = RolePermissionRepository.get_permissions_by_role(db, user.role)
        
        user_resp = UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            permissions=permissions
        )
        
        return TokenResponse(access_token=access_token, user=user_resp)
