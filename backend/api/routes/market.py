from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.core.websocket_manager import ws_manager

router = APIRouter()

@router.websocket("/")
async def market_data_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time market data (tickers).
    The client receives a snapshot on connection and updates continuously.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # We don't expect the client to send us data right now, 
            # but we need to receive to handle client disconnects properly.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
