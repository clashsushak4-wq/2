import asyncio
import aiohttp
import json
from loguru import logger
from backend.core.websocket_manager import ws_manager
from shared.database.core import async_session_maker
from shared.database.repo.exchanges import ExchangeRepo

class ExchangeManager:
    def __init__(self):
        self.active_tasks = {}
        self.session = None

    async def start(self):
        logger.info("Starting Exchange Manager...")
        self.session = aiohttp.ClientSession()
        
        # Read active exchanges from DB
        async with async_session_maker() as db_session:
            repo = ExchangeRepo(db_session)
            exchanges = await repo.get_active()

        for ex in exchanges:
            name_lower = ex.name.lower()
            if "bybit" in name_lower:
                logger.info(f"Starting Bybit WS for exchange config ID {ex.id}")
                task = asyncio.create_task(self.run_bybit_ws())
                self.active_tasks[ex.id] = task
            elif "binance" in name_lower:
                logger.info(f"Starting Binance WS for exchange config ID {ex.id}")
                task = asyncio.create_task(self.run_binance_ws())
                self.active_tasks[ex.id] = task
            else:
                logger.warning(f"Unsupported exchange name: {ex.name}")

    async def stop(self):
        logger.info("Stopping Exchange Manager...")
        for task in self.active_tasks.values():
            task.cancel()
        if self.session:
            await self.session.close()

    async def run_bybit_ws(self):
        url = "wss://stream.bybit.com/v5/public/linear"
        rest_url = "https://api.bybit.com/v5/market/instruments-info?category=linear"
        
        while True:
            try:
                # 1. Fetch all symbols to subscribe to
                async with self.session.get(rest_url) as resp:
                    data = await resp.json()
                    symbols = [item["symbol"] for item in data["result"]["list"] if item["status"] == "Trading"]
                
                logger.info(f"Fetched {len(symbols)} Bybit symbols.")
                
                # Take top 100 for stability/testing (or all if we manage chunks properly)
                # Bybit allows up to 10 args per subscribe request.
                subscribe_args = [f"tickers.{s}" for s in symbols]
                
                async with self.session.ws_connect(url) as ws:
                    logger.info("Connected to Bybit WS.")
                    
                    # Subscribe in chunks of 10
                    chunk_size = 10
                    for i in range(0, len(subscribe_args), chunk_size):
                        chunk = subscribe_args[i:i+chunk_size]
                        await ws.send_json({"op": "subscribe", "args": chunk})
                        await asyncio.sleep(0.1) # Small delay to prevent rate limit
                        
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            data = json.loads(msg.data)
                            if "topic" in data and data["topic"].startswith("tickers.") and "data" in data:
                                # Normalize and broadcast
                                d = data["data"]
                                symbol = d.get("symbol")
                                last_price = d.get("lastPrice")
                                change_24h = d.get("price24hPcnt")
                                vol_24h = d.get("turnover24h")
                                
                                if symbol and last_price:
                                    update = {
                                        "symbol": symbol,
                                        "price": float(last_price),
                                        "change24h": float(change_24h) * 100 if change_24h else 0.0,
                                        "volume24h": float(vol_24h) if vol_24h else 0.0,
                                        "exchange": "Bybit"
                                    }
                                    await ws_manager.broadcast_market_update([update])
                                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Bybit WS Error: {e}")
                await asyncio.sleep(5) # Reconnect delay

    async def run_binance_ws(self):
        url = "wss://fstream.binance.com/ws/!ticker@arr"
        while True:
            try:
                async with self.session.ws_connect(url) as ws:
                    logger.info("Connected to Binance WS.")
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            data = json.loads(msg.data)
                            updates = []
                            for d in data:
                                updates.append({
                                    "symbol": d["s"],
                                    "price": float(d["c"]),
                                    "change24h": float(d["P"]),
                                    "volume24h": float(d["q"]),
                                    "exchange": "Binance"
                                })
                            if updates:
                                await ws_manager.broadcast_market_update(updates)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Binance WS Error: {e}")
                await asyncio.sleep(5)

exchange_manager = ExchangeManager()
