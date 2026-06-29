import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.users.schemas import UserResponse, UserUpdate, BusinessInfoUpdate
from app.modules.users import services

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.email:
        existing = services.get_user_by_email(db, data.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already taken",
            )
    update_data = data.model_dump(exclude_unset=True, exclude={"is_active"})
    if data.email:
        update_data["email"] = data.email.lower().strip()
    return services.update_user(db, current_user, **update_data)


@router.patch("/me/business", response_model=UserResponse)
def update_business_info(
    data: BusinessInfoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    valid_business_types = {"sole_trader", "limited_company", "partnership", "llp"}
    valid_revenue_ranges = {
        "0-25k",
        "25k-50k",
        "50k-100k",
        "100k-250k",
        "250k-500k",
        "500k+",
    }

    if data.business_type and data.business_type not in valid_business_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid business_type. Must be one of: {', '.join(valid_business_types)}",
        )
    if data.revenue_range and data.revenue_range not in valid_revenue_ranges:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid revenue_range. Must be one of: {', '.join(valid_revenue_ranges)}",
        )

    update_data = data.model_dump(exclude_unset=True)
    update_data["onboarding_completed"] = True
    return services.update_user(db, current_user, **update_data)


@router.get("/me/export")
def export_my_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export all user data as JSON for GDPR compliance."""
    data = services.export_user_data(db, current_user.id)
    json_bytes = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={
            "Content-Disposition": 'attachment; filename="my_data_export.json"',
        },
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete the current user's account and all associated data (GDPR right to erasure)."""
    services.delete_user_account(db, current_user.id)
    return None
