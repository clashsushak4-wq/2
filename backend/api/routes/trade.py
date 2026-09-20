from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.core.deps import get_current_user_id
from backend.services.bybit_market import MarketError
from backend.services.demo_engine import DemoError
from backend.services.demo_service import demo_service
from backend.services.exchange_manager import exchange_manager

router = APIRouter()


class AccountRequest(BaseModel):
    version: str = Field(min_length=1, max_length=64)


class TPSL(BaseModel):
    model_config = ConfigDict(extra="forbid")
    takeProfitPrice: Decimal | None = Field(default=None, gt=0, allow_inf_nan=False)
    stopLossPrice: Decimal | None = Field(default=None, gt=0, allow_inf_nan=False)


class DemoCommand(AccountRequest):
    model_config = ConfigDict(extra="forbid")
    action: Literal["order", "close", "cancel", "cancel_all", "tpsl", "reset"]
    accountId: str = Field(min_length=1, max_length=64)
    clientOrderId: str | None = Field(default=None, min_length=1, max_length=80)
    symbol: str | None = Field(default=None, pattern=r"^[A-Z0-9]{2,40}$")
    direction: Literal["long", "short"] | None = None
    intent: Literal["open", "close"] | None = None
    type: Literal["market", "limit"] | None = None
    quantity: Decimal | None = Field(default=None, gt=0, allow_inf_nan=False)
    limitPrice: Decimal | None = Field(default=None, gt=0, allow_inf_nan=False)
    leverage: Decimal | None = Field(default=None, ge=1, allow_inf_nan=False)
    marginMode: Literal["isolated"] = "isolated"
    tpsl: TPSL = Field(default_factory=TPSL)
    orderId: str | None = Field(default=None, min_length=1, max_length=80)

    @model_validator(mode="after")
    def required_fields(self):
        if self.action in {"order", "close", "tpsl"} and not self.symbol:
            raise ValueError("symbol_required")
        if self.action in {"order", "close", "reset"} and not self.clientOrderId:
            raise ValueError("client_order_id_required")
        if self.action == "order" and any(value is None for value in
                (self.direction, self.intent, self.type, self.quantity, self.leverage)):
            raise ValueError("order_fields_required")
        if self.action == "cancel" and not self.orderId:
            raise ValueError("order_id_required")
        return self


@router.get("/instruments")
async def get_instruments():
    return list(exchange_manager.instruments_cache.values())


@router.get("/account")
async def get_account(source: str | None = None, user_id: int = Depends(get_current_user_id)):
    return await demo_service.get_state(user_id, source)


@router.get("/accounts")
async def get_accounts(user_id: int = Depends(get_current_user_id)):
    return await demo_service.list_accounts(user_id)


@router.post("/account")
async def create_account(request: AccountRequest, user_id: int = Depends(get_current_user_id)):
    try:
        return await demo_service.create_account(user_id, request.version)
    except (DemoError, MarketError) as error:
        raise HTTPException(409, detail=str(error)) from None


@router.post("/command")
async def command(request: DemoCommand, user_id: int = Depends(get_current_user_id)):
    try:
        return await demo_service.command(user_id, request.model_dump())
    except (DemoError, MarketError) as error:
        raise HTTPException(409, detail=str(error)) from None


@router.post("/order")
async def obsolete_order_endpoint(user_id: int = Depends(get_current_user_id)):
    raise HTTPException(410, detail="Use /api/trade/command with the current source version")
