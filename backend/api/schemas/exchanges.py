from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from shared.market_settings import MarketSettings


class ExchangeCreate(BaseModel):
    name: str = Field(default="Bybit", pattern="^Bybit$")
    api_key: str = Field(default="", max_length=200)
    api_secret: str = Field(default="", max_length=200)
    market_settings: MarketSettings = Field(default_factory=MarketSettings)

    @model_validator(mode="after")
    def paired_credentials(self):
        if bool(self.api_key) != bool(self.api_secret):
            raise ValueError("Both API credentials are required together")
        return self


class ExchangeUpdate(BaseModel):
    api_key: str | None = Field(default=None, max_length=200)
    api_secret: str | None = Field(default=None, max_length=200)
    market_settings: MarketSettings | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def paired_credentials(self):
        if (self.api_key is None) != (self.api_secret is None) or bool(self.api_key) != bool(self.api_secret):
            raise ValueError("Both API credentials are required together")
        return self


class ExchangeResponse(BaseModel):
    id: int
    name: str
    api_key_masked: str
    is_active: bool
    created_at: datetime
    market_settings: MarketSettings
    supported: bool
    health: dict

    model_config = {"from_attributes": True}
