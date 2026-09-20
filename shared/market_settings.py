"""Validated settings owned by the exchange configuration in the admin app."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MarketSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    environment: Literal["mainnet", "testnet"] = "mainnet"
    category: Literal["linear"] = "linear"
    quote: Literal["USDT"] = "USDT"
    contract_type: Literal["LinearPerpetual"] = "LinearPerpetual"
    initial_balance: float = Field(default=5300, gt=0, le=1_000_000_000, allow_inf_nan=False)


def source_key(exchange_id: int, settings: MarketSettings) -> str:
    return f"{exchange_id}:bybit:{settings.environment}:{settings.category}:{settings.quote}"
