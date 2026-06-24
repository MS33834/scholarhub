from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.limiter import rate_limit
from app.db.session import get_db
from app.models.models import Resource
from app.schemas import DisciplineListResponse, DisciplineResponse

router = APIRouter(prefix="/disciplines", tags=["disciplines"])

# Canonical discipline catalog. Slugs are stable identifiers used by the frontend.
DISCIPLINES = [
    {
        "slug": "computer-science",
        "name": "计算机科学",
        "name_en": "Computer Science",
        "description": "人工智能、机器学习、计算机视觉、自然语言处理与软件工程。",
    },
    {
        "slug": "mathematics",
        "name": "数学",
        "name_en": "Mathematics",
        "description": "线性代数、统计学、微积分、概率论与离散数学。",
    },
    {
        "slug": "physics",
        "name": "物理学",
        "name_en": "Physics",
        "description": "理论物理、天体物理、量子力学与引力波天文学。",
    },
    {
        "slug": "life-sciences",
        "name": "生命科学",
        "name_en": "Life Sciences",
        "description": "分子生物学、细胞生物学、进化生物学与蛋白质组学。",
    },
    {
        "slug": "social-sciences",
        "name": "社会科学",
        "name_en": "Social Sciences",
        "description": "经济学、心理学、社会学与行为科学。",
    },
    {
        "slug": "humanities",
        "name": "人文学科",
        "name_en": "Humanities",
        "description": "哲学、历史、文学与艺术理论。",
    },
    {
        "slug": "medicine",
        "name": "医学",
        "name_en": "Medicine",
        "description": "临床医学、药理学、公共卫生与转化医学。",
    },
    {
        "slug": "law",
        "name": "法学",
        "name_en": "Law",
        "description": "宪法学、民法学、刑法学与国际法。",
    },
]


@router.get("/", response_model=DisciplineListResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def list_disciplines(
    request: Request,
    include_stats: Annotated[bool, Query()] = True,
    db: AsyncSession = Depends(get_db),
):
    items = []

    if include_stats:
        count_result = await db.execute(
            select(Resource.discipline, func.count()).group_by(Resource.discipline)
        )
        counts = {row[0]: row[1] for row in count_result.all()}
    else:
        counts = {}

    for d in DISCIPLINES:
        items.append(
            DisciplineResponse(
                slug=d["slug"],
                name=d["name"],
                name_en=d["name_en"],
                description=d["description"],
                resource_count=counts.get(d["slug"], 0),
            )
        )

    return DisciplineListResponse(data=items)


@router.get("/{slug}", response_model=DisciplineResponse)
@rate_limit(f"{settings.rate_limit_per_minute}/minute")
async def get_discipline(
    request: Request,
    slug: str,
    include_stats: Annotated[bool, Query()] = True,
    db: AsyncSession = Depends(get_db),
):
    discipline = next((d for d in DISCIPLINES if d["slug"] == slug), None)
    if not discipline:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discipline not found")

    resource_count = 0
    if include_stats:
        count_result = await db.execute(select(func.count()).where(Resource.discipline == slug))
        resource_count = count_result.scalar() or 0

    return DisciplineResponse(
        slug=discipline["slug"],
        name=discipline["name"],
        name_en=discipline["name_en"],
        description=discipline["description"],
        resource_count=resource_count,
    )
