from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.models import Resource, User

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("/")
async def list_resources(
    type: str | None = None,
    discipline: str | None = None,
    year: int | None = None,
    q: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(Resource)

    if type:
        query = query.where(Resource.type == type)
    if discipline:
        query = query.where(Resource.discipline == discipline)
    if year:
        query = query.where(Resource.year == year)
    if q:
        query = query.where(
            Resource.title.ilike(f"%{q}%") | Resource.abstract.ilike(f"%{q}%")
        )

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    resources = result.scalars().all()
    return {"resources": resources, "count": len(resources)}


@router.get("/{resource_id}")
async def get_resource(resource_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.post("/", status_code=201)
async def create_resource(
    resource: dict,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    new_resource = Resource(**resource)
    db.add(new_resource)
    await db.commit()
    await db.refresh(new_resource)
    return new_resource


@router.put("/{resource_id}")
async def update_resource(
    resource_id: str,
    updates: dict,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    for key, value in updates.items():
        setattr(resource, key, value)

    await db.commit()
    await db.refresh(resource)
    return resource


@router.delete("/{resource_id}", status_code=204)
async def delete_resource(
    resource_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    await db.delete(resource)
    await db.commit()
