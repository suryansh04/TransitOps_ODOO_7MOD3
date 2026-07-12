from sqlalchemy.orm import Session
from app.models.user import User, RolePermission

class UserRepository:
    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> User | None:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def update(db: Session, user: User) -> User:
        db.commit()
        db.refresh(user)
        return user

class RolePermissionRepository:
    @staticmethod
    def get_permissions_by_role(db: Session, role: str) -> dict[str, str]:
        perms = db.query(RolePermission).filter(RolePermission.role == role).all()
        return {p.module: p.access_level for p in perms}
