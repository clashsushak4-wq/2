"""Admin exchange management — CRUD for exchange API keys."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.schemas import SuccessResponse
from backend.api.schemas.exchanges import ExchangeCreate, ExchangeResponse
from backend.core.deps import get_session, get_admin_user_id
from shared.database.repo.exchanges import ExchangeRepo

router = APIRouter()


def _mask(key: str) -> str:
    if not key:
        return "публичный"
    if len(key) <= 8:
        return "••••••"
    return key[:4] + "••••" + key[-4:]


def _to_response(ex, repo: ExchangeRepo) -> ExchangeResponse:
    api_key, _ = repo.decrypt_key(ex)
    return ExchangeResponse(
        id=ex.id,
        name=ex.name,
        api_key_masked=_mask(api_key),
        is_active=ex.is_active,
        created_at=ex.created_at,
    )


@router.get("/", response_model=list[ExchangeResponse])
async def list_exchanges(
    session: AsyncSession = Depends(get_session),
    _admin_id: int = Depends(get_admin_user_id),
):
    repo = ExchangeRepo(session)
    exchanges = await repo.get_all()
    return [_to_response(ex, repo) for ex in exchanges]


@router.post("/", response_model=ExchangeResponse)
async def add_exchange(
    data: ExchangeCreate,
    session: AsyncSession = Depends(get_session),
    _admin_id: int = Depends(get_admin_user_id),
):
    repo = ExchangeRepo(session)
    ex = await repo.create(name=data.name, api_key=data.api_key, api_secret=data.api_secret)
    return _to_response(ex, repo)


@router.delete("/{exchange_id}", response_model=SuccessResponse)
async def delete_exchange(
    exchange_id: int,
    session: AsyncSession = Depends(get_session),
    _admin_id: int = Depends(get_admin_user_id),
):
    repo = ExchangeRepo(session)
    deleted = await repo.delete_exchange(exchange_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Exchange not found")
    return SuccessResponse()
