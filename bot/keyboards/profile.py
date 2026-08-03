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

from shared.utils.i18n import i18n, safe_emoji


# --- ROOT INLINE: главный экран Профиля ---

def profile_main_inline_kb(_: Callable) -> InlineKeyboardMarkup:
    """Инлайн-клавиатура карточки профиля (фото + ID/ник/...)."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_settings"), callback_data="profile:settings", icon_custom_emoji_id=safe_emoji(_("btn_settings_emoji")))
    builder.button(text=_("btn_back"), callback_data="nav_main_menu", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
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
    builder.button(text=_("btn_security"), callback_data="profile:security", icon_custom_emoji_id=safe_emoji(_("btn_security_emoji")))
    builder.button(text=_("btn_language"), callback_data="profile:language", icon_custom_emoji_id=safe_emoji(_("btn_language_emoji")))
    builder.button(text=_("btn_notifications"), callback_data="profile:notifications", icon_custom_emoji_id=safe_emoji(_("btn_notifications_emoji")))
    builder.button(text=_("btn_change_nick"), callback_data="profile:nickname", icon_custom_emoji_id=safe_emoji(_("btn_change_nick_emoji")))
    builder.button(text=_("btn_back"), callback_data="profile:back_to_main", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
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
        builder.button(text=_("btn_change_password"), callback_data="security:change", icon_custom_emoji_id=safe_emoji(_("btn_change_password_emoji")))
        builder.button(text=_("btn_sessions"), callback_data="security:sessions", icon_custom_emoji_id=safe_emoji(_("btn_sessions_emoji")))
        builder.button(text=_("btn_logout_all"), callback_data="security:logout_all", icon_custom_emoji_id=safe_emoji(_("btn_logout_all_emoji")))
    else:
        builder.button(text=_("btn_set_password"), callback_data="security:set", icon_custom_emoji_id=safe_emoji(_("btn_set_password_emoji")))
    builder.button(text=_("btn_back"), callback_data="profile:back_to_settings", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    builder.adjust(1)
    return builder.as_markup()


def security_sessions_back_kb(_: Callable) -> InlineKeyboardMarkup:
    """Кнопка возврата с карточки списка сессий обратно в Безопасность."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_back"), callback_data="security:sessions_back", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    return builder.as_markup()


def security_cancel_kb(_: Callable) -> InlineKeyboardMarkup:
    """Кнопка отмены ввода пароля — возвращает на экран Безопасности."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_cancel"), callback_data="security:cancel", icon_custom_emoji_id=safe_emoji(_("btn_cancel_emoji")))
    return builder.as_markup()


def security_logout_all_confirm_kb(_: Callable) -> InlineKeyboardMarkup:
    """Подтверждение завершения всех WebApp сессий."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_confirm"), callback_data="security:logout_all_confirm", icon_custom_emoji_id=safe_emoji(_("btn_confirm_emoji")))
    builder.button(text=_("btn_cancel"), callback_data="security:cancel", icon_custom_emoji_id=safe_emoji(_("btn_cancel_emoji")))
    builder.adjust(1)
    return builder.as_markup()


# --- SUB-INLINE: экраны выбора языка ---

def language_inline_kb(_: Callable, show_back: bool = True) -> InlineKeyboardMarkup:
    """Выбор языка (сетка 2×2) + опциональный возврат в Настройки.

    Раскладка:
        [🇷🇺 Русский]  [🇺🇸 English]
        [🇺🇦 Українська] [🇹🇷 Türkçe]
        [↩️ Назад] (только если show_back=True)
    """
    builder = InlineKeyboardBuilder()
    builder.button(text=_("lang_ru"), callback_data="lang_ru", icon_custom_emoji_id=safe_emoji(_("lang_ru_emoji")))
    builder.button(text=_("lang_en"), callback_data="lang_en", icon_custom_emoji_id=safe_emoji(_("lang_en_emoji")))
    builder.button(text=_("lang_ua"), callback_data="lang_ua", icon_custom_emoji_id=safe_emoji(_("lang_ua_emoji")))
    builder.button(text=_("lang_tr"), callback_data="lang_tr", icon_custom_emoji_id=safe_emoji(_("lang_tr_emoji")))
    
    if show_back:
        builder.button(text=_("btn_back"), callback_data="profile:back_to_settings", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
        builder.adjust(2, 2, 1)
    else:
        builder.adjust(2, 2)
        
    return builder.as_markup()


def language_confirm_kb(_: Callable, target_lang_code: str) -> InlineKeyboardMarkup:
    """Подтверждение смены языка. Подтверждение/отмена — на языке цели."""
    builder = InlineKeyboardBuilder()
    confirm_text = i18n.get("btn_confirm", lang=target_lang_code)
    cancel_text = _("btn_cancel")
    builder.button(text=confirm_text, callback_data=f"conf_lang_{target_lang_code}", icon_custom_emoji_id=safe_emoji(_("btn_confirm_emoji")))
    builder.button(text=cancel_text, callback_data="cancel_lang_change", icon_custom_emoji_id=safe_emoji(_("btn_cancel_emoji")))
    builder.adjust(1)
    return builder.as_markup()


# --- SUB-INLINE: экраны смены ника ---

def change_nick_start_kb(_: Callable) -> InlineKeyboardMarkup:
    """Изменение ника (Настройки → Никнейм).
    [Изменить сейчас]
    [↩️ Назад]
    """
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_change_nick_action"), callback_data="start_change_nick", icon_custom_emoji_id=safe_emoji(_("btn_change_nick_action_emoji")))
    builder.button(text=_("btn_back"), callback_data="profile:back_to_settings", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    builder.adjust(1)
    return builder.as_markup()

def cancel_nick_change_kb(_: Callable) -> InlineKeyboardMarkup:
    """Отмена ввода ника.
    [↩️ Отмена]
    """
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_cancel"), callback_data="cancel_change_nick", icon_custom_emoji_id=safe_emoji(_("btn_cancel_emoji")))
    return builder.as_markup()


def confirm_nick_kb(_: Callable) -> InlineKeyboardMarkup:
    """Подтверждение нового ника. Назад здесь не нужен — есть Отмена."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("nick_btn_confirm"), callback_data="confirm_new_nick", icon_custom_emoji_id=safe_emoji(_("nick_btn_confirm_emoji")))
    builder.button(text=_("btn_cancel"), callback_data="cancel_change_nick", icon_custom_emoji_id=safe_emoji(_("btn_cancel_emoji")))
    builder.adjust(1)
    return builder.as_markup()


# --- SUB-INLINE: экран уведомлений ---

def notifications_kb(_: Callable, is_enabled: bool) -> InlineKeyboardMarkup:
    """Переключатель уведомлений + возврат в Настройки."""
    builder = InlineKeyboardBuilder()
    if is_enabled:
        text = _("btn_toggle_off")
        data = "notif_disable"
        emoji_id = "5974565736578813237"
    else:
        text = _("btn_toggle_on")
        data = "notif_enable"
        emoji_id = "5974076810386738645"
    builder.button(text=text, callback_data=data, icon_custom_emoji_id=emoji_id)
    builder.button(text=_("btn_back"), callback_data="profile:back_to_settings", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    builder.adjust(1)
    return builder.as_markup()