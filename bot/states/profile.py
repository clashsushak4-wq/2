# states/profile.py
from aiogram.fsm.state import State, StatesGroup


class ProfileState(StatesGroup):
    main = State()
    settings = State()
    language = State()
    settings_notifications = State()
    nick_change_input = State()
    nick_change_confirm = State()

    # Безопасность WebApp
    security = State()
    security_password_set_input = State()
    security_password_set_confirm = State()
    security_password_change_old = State()
    security_password_change_new = State()
    security_password_change_confirm = State()
