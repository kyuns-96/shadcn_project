import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import DoESetup, User
from app.schemas import DoESetupCreate, DoESetupResponse, DoESetupUpdate

router = APIRouter()


@router.get("", response_model=list[DoESetupResponse])
async def list_setups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DoESetup)
        .where(DoESetup.user_id == current_user.id)
        .order_by(DoESetup.updated_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=DoESetupResponse, status_code=201)
async def create_setup(
    body: DoESetupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    setup = DoESetup(
        user_id=current_user.id,
        name=body.name,
        config=body.config,
    )
    db.add(setup)
    await db.commit()
    await db.refresh(setup)
    return setup


@router.put("/{setup_id}", response_model=DoESetupResponse)
async def update_setup(
    setup_id: uuid.UUID,
    body: DoESetupUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DoESetup).where(
            DoESetup.id == setup_id, DoESetup.user_id == current_user.id
        )
    )
    setup = result.scalar_one_or_none()
    if not setup:
        raise HTTPException(status_code=404, detail="Setup not found")

    if body.name is not None:
        setup.name = body.name
    if body.config is not None:
        setup.config = body.config

    await db.commit()
    await db.refresh(setup)
    return setup


@router.delete("/{setup_id}", status_code=204)
async def delete_setup(
    setup_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DoESetup).where(
            DoESetup.id == setup_id, DoESetup.user_id == current_user.id
        )
    )
    setup = result.scalar_one_or_none()
    if not setup:
        raise HTTPException(status_code=404, detail="Setup not found")

    await db.delete(setup)
    await db.commit()
