from pydantic import BaseModel
from typing import Optional

# Common
class SuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None

class UploadResponse(BaseModel):
    url: str
    thumb_url: Optional[str] = None

# Auth
class TelegramAuthRequest(BaseModel):
    init_data: str

class AuthResponse(BaseModel):
    success: bool
    user_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
