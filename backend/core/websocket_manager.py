import asyncio
import json
from loguru import logger
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # List of active client connections
        self.active_connections: list[WebSocket] = []
        # Cache of the latest market data snapshot (symbol -> data)
        self.market_cache: dict[str, dict] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total clients: {len(self.active_connections)}")
        
        # Send the latest snapshot immediately upon connection
        if self.market_cache:
            try:
                await websocket.send_json({
                    "type": "snapshot",
                    "data": list(self.market_cache.values())
                })
            except Exception as e:
                logger.error(f"Error sending snapshot to new client: {e}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast_market_update(self, updates: list[dict]):
        """
        updates: list of dicts with normalized market data
        Updates the internal cache and broadcasts to all clients.
        """
        if not updates:
            return

        # Update cache
        for item in updates:
            self.market_cache[item["symbol"]] = item

        if not self.active_connections:
            return

        message = {
            "type": "update",
            "data": updates
        }
        
        # Serialize once
        msg_str = json.dumps(message)

        # Broadcast to all
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(msg_str)
            except Exception:
                disconnected.append(connection)

        # Cleanup dead connections
        for dead_conn in disconnected:
            self.disconnect(dead_conn)

# Global instance
ws_manager = ConnectionManager()
