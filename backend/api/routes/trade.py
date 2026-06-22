import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from shared.database.core import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from backend.api.dependencies import require_user

logger = logging.getLogger(__name__)

router = APIRouter()

class PlaceOrderRequest(BaseModel):
    symbol: str
    side: str
    type: str
    quantity: float
    price: Optional[float] = None
    leverage: int

@router.post("/order")
async def place_order(
    req: PlaceOrderRequest,
    user_id: int = Depends(require_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Simulated paper trading endpoint.
    Accepts an order and immediately returns success for demonstration purposes.
    """
    logger.info("User %s placed paper trade order: %s", user_id, req)
    
    # In a real system, we'd deduct margin balance and save the position to DB.
    # For now, we simulate success.
    return {
        "success": True,
        "message": f"Order placed successfully: {req.side} {req.symbol} x{req.leverage}",
        "order": {
            "symbol": req.symbol,
            "side": req.side,
            "type": req.type,
            "quantity": req.quantity,
            "price": req.price,
            "leverage": req.leverage,
            "status": "filled",
        }
    }
