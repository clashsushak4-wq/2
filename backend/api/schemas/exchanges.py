from pydantic import BaseModel
from datetime import datetime


class ExchangeCreate(BaseModel):
    name: str
    api_key: str = ""
    api_secret: str = ""


class ExchangeResponse(BaseModel):
    id: int
    name: str
    api_key_masked: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
