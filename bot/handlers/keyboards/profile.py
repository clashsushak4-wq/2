# handlers/keyboards/profile.py
"""Inline-клавиатуры экранов Профиля.

Архитектура навигации:
  * Нижняя reply-панель (`main_menu_kb`) — единственная reply-клава
    в Профиле, отвечает за вход в раздел через `btn_profile`.
  * Все sub-экраны (Настройки, Язык, Никнейм, Уведомления) — это
    callback'и одного и того же сообщения (с фото или без), которое
    редактируется через `edit_caption`/`edit_text`.
  * Возврат на 1 уровень — inline-кнопка `« Назад` с callback'ом
    `profile:back_to_<parent>`.

Callback-namespace:
  * `profile:settings` — войти в Настройки.
  * `profile:back_to_main` — вернуться на карточку профиля.
  * `profile:language` / `profile:nickname` / `profile:notifications` —
    войти в соответствующий подэкран Настроек.
  * `profile:back_to_settings` — вернуться в Настройки из подэкранов.
  * Существующие `lang_*`, `conf_lang_*`, `cancel_lang_change`,
    `start_change_nick`, `confirm_new_nick`, `cancel_change_nick`,
    `notif_enable`, `notif_disable` — оставлены для совместимости
    с handlers, но участвуют в новой иерархии.
"""

from typing import Callable

from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from shared.utils.i18n import i18n


# --- ROOT INLINE: главный экран Профиля ---

def profile_main_inline_kb(_: Callable) -> InlineKeyboardMarkup:
    """Инлайн-клавиатура карточки профиля (фото + ID/ник/...)."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_settings"), callback_data="profile:settings")
    builder.adjust(1)
    return builder.as_markup()


def settings_inline_kb(_: Callable) -> InlineKeyboardMarkup:
    """Инлайн-клавиатура меню Настроек.

    Раскладка 2×2 по важности:
        [Безопасность] [Язык]
        [Уведомления]  [Ник]
        [↩ Назад]
    """
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_security"), callback_data="profile:security")
    builder.button(text=_("btn_language"), callback_data="profile:language")
    builder.button(text=_("btn_notifications"), callback_data="profile:notifications")
    builder.button(text=_("btn_change_nick"), callback_data="profile:nickname")
    builder.button(text=_("btn_back"), callback_data="profile:back_to_main")
    builder.adjust(2, 2, 1)
    return builder.as_markup()


# --- SUB-INLINE: экран безопасности ---

def security_inline_kb(_: Callable, has_password: bool) -> InlineKeyboardMarkup:
    """Главный экран Безопасности WebApp.

    Если пароля нет — кнопка «Создать пароль».
    Если есть — «Сменить пароль», «Текущие сессии», «Завершить все сессии».
    """
    builder = InlineKeyboardBuilder()
    if has_password:
        builder.button(text=_("btn_change_password"), callback_data="security:change")
        builder.button(text=_("btn_sessions"), callback_data="security:sessions")
        builder.button(text=_("btn_logout_all"), callback_data="security:logout_all")
    else:
        builder.button(text=_("btn_set_password"), callback_data="security:set")
    builder.button(text=_("btn_back"), callback_data="profile:back_to_settings")
    builder.adjust(1)
    return builder.as_markup()


def security_sessions_back_kb(_: Callable) -> InlineKeyboardMarkup:
    """Кнопка возврата с карточки списка сессий обратно в Безопасность."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_back"), callback_data="security:sessions_back")
    return builder.as_markup()


def security_cancel_kb(_: Callable) -> InlineKeyboardMarkup:
    """Кнопка отмены ввода пароля — возвращает на экран Безопасности."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_cancel"), callback_data="security:cancel")
    return builder.as_markup()


def security_logout_all_confirm_kb(_: Callable) -> InlineKeyboardMarkup:
    """Подтверждение завершения всех WebApp сессий."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_confirm"), callback_data="security:logout_all_confirm")
    builder.button(text=_("btn_cancel"), callback_data="security:cancel")
    builder.adjust(1)
    return builder.as_markup()


# --- SUB-INLINE: экраны выбора языка ---

def language_inline_kb(_: Callable) -> InlineKeyboardMarkup:
    """Выбор языка (сетка 2×2) + возврат в Настройки.

    Раскладка:
        [🇷🇺 Русский]  [🇺🇸 English]
        [🇺🇦 Українська] [🇹🇷 Türkçe]
        [↩️ Назад]
    Две кнопки в ряду заполняют ширину сообщения, поэтому визуально
    клавиатура выровнена по краям медиа-карточки сверху.
    """
    builder = InlineKeyboardBuilder()
    builder.button(text=_("lang_ru"), callback_data="lang_ru")
    builder.button(text=_("lang_en"), callback_data="lang_en")
    builder.button(text=_("lang_ua"), callback_data="lang_ua")
    builder.button(text=_("lang_tr"), callback_data="lang_tr")
    builder.button(text=_("btn_back"), callback_data="profile:back_to_settings")
    builder.adjust(2, 2, 1)
    return builder.as_markup()


def language_confirm_kb(_: Callable, target_lang_code: str) -> InlineKeyboardMarkup:
    """Подтверждение смены языка. Подтверждение/отмена — на языке цели."""
    builder = InlineKeyboardBuilder()
    confirm_text = i18n.get("btn_confirm", lang=target_lang_code)
    cancel_text = _("btn_cancel")
    builder.button(text=confirm_text, callback_data=f"conf_lang_{target_lang_code}")
    builder.button(text=cancel_text, callback_data="cancel_lang_change")
    builder.adjust(1)
    return builder.as_markup()


# --- SUB-INLINE: экраны смены ника ---

def change_nick_start_kb(_: Callable) -> InlineKeyboardMarkup:
    """Кнопка начала смены ника + возврат в Настройки."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_change_nick_action"), callback_data="start_change_nick")
    builder.button(text=_("btn_back"), callback_data="profile:back_to_settings")
    builder.adjust(1)
    return builder.as_markup()


def confirm_nick_kb(_: Callable) -> InlineKeyboardMarkup:
    """Подтверждение нового ника. Назад здесь не нужен — есть Отмена."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("nick_btn_confirm"), callback_data="confirm_new_nick")
    builder.button(text=_("btn_cancel"), callback_data="cancel_change_nick")
    builder.adjust(1)
    return builder.as_markup()


# --- SUB-INLINE: экран уведомлений ---

def notifications_kb(_: Callable, is_enabled: bool) -> InlineKeyboardMarkup:
    """Переключатель уведомлений + возврат в Настройки."""
    builder = InlineKeyboardBuilder()
    if is_enabled:
        text = _("btn_toggle_off")
        data = "notif_disable"
    else:
        text = _("btn_toggle_on")
        data = "notif_enable"
    builder.button(text=text, callback_data=data)
    builder.button(text=_("btn_back"), callback_data="profile:back_to_settings")
    builder.adjust(1)
    return builder.as_markup()