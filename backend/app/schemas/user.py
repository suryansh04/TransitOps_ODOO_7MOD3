from pydantic import BaseModel, EmailStr, field_validator
from typing import Dict, Any

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        valid_roles = ['fleet_manager', 'dispatcher', 'safety_officer', 'financial_analyst']
        if v not in valid_roles:
            raise ValueError(f"Invalid role. Must be one of {valid_roles}")
        return v

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    permissions: Dict[str, str] = {}

    class Config:
        from_attributes = True

    @classmethod
    def build(cls, user, permissions: Dict[str, str]):
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            permissions=permissions
        )

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

    class Config:
        from_attributes = True
