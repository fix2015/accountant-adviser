import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum

from app.database import Base


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Onboarding fields
    business_type = Column(
        String(50), nullable=True
    )  # sole_trader, limited_company, partnership, llp
    revenue_range = Column(
        String(50), nullable=True
    )  # 0-25k, 25k-50k, 50k-100k, 100k-250k, 250k-500k, 500k+
    employee_count = Column(Integer, nullable=True, default=0)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
