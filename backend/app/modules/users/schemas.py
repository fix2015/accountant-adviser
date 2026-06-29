from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.modules.users.models import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class BusinessInfoUpdate(BaseModel):
    business_type: Optional[str] = (
        None  # sole_trader, limited_company, partnership, llp
    )
    revenue_range: Optional[str] = (
        None  # 0-25k, 25k-50k, 50k-100k, 100k-250k, 250k-500k, 500k+
    )
    employee_count: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    business_type: Optional[str] = None
    revenue_range: Optional[str] = None
    employee_count: Optional[int] = None
    onboarding_completed: bool = False

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
