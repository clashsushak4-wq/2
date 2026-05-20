# states/trading.py
from aiogram.fsm.state import State, StatesGroup


class TradingState(StatesGroup):
    main = State()
