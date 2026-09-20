"""Bounded per-client writers isolate browsers from the exchange reader."""

import asyncio
from contextlib import suppress

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.connections: dict[WebSocket, asyncio.Queue] = {}
        self.writers: dict[WebSocket, asyncio.Task] = {}
        self.subscriptions: dict[WebSocket, tuple[str, str]] = {}

    async def connect(self, websocket, snapshot):
        await websocket.accept()
        queue = asyncio.Queue(maxsize=32)
        self.connections[websocket] = queue
        queue.put_nowait(snapshot)
        self.writers[websocket] = asyncio.create_task(self._write(websocket, queue))

    async def _write(self, websocket, queue):
        try:
            while True:
                await asyncio.wait_for(websocket.send_json(await queue.get()), timeout=5)
        except (Exception, asyncio.CancelledError):
            pass
        finally:
            self.connections.pop(websocket, None)
            self.subscriptions.pop(websocket, None)
            self.writers.pop(websocket, None)
            with suppress(Exception):
                await websocket.close(code=1013)

    def disconnect(self, websocket):
        self.connections.pop(websocket, None)
        self.subscriptions.pop(websocket, None)
        task = self.writers.pop(websocket, None)
        if task:
            task.cancel()

    def send(self, websocket, message):
        queue = self.connections.get(websocket)
        if queue is None:
            return
        try:
            queue.put_nowait(message)
        except asyncio.QueueFull:
            self.disconnect(websocket)

    def publish(self, message):
        for websocket in list(self.connections):
            if message["type"] in {"orderbook", "trades", "candle"}:
                subscription = self.subscriptions.get(websocket)
                if not subscription or subscription[0] != message["symbol"]:
                    continue
                if message["type"] == "candle" and subscription[1] != message["timeframe"]:
                    continue
            self.send(websocket, message)

    async def stop(self):
        tasks = list(self.writers.values())
        for websocket in list(self.connections):
            self.disconnect(websocket)
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)


ws_manager = ConnectionManager()
