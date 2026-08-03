# components/i18n.py
import json
import logging
import os
from typing import Dict

class I18n:
    def __init__(self):
        self.locales: Dict[str, Dict[str, str]] = {}
        self.default_lang = "ru"

    def load_locales(self, locales_dir: str | None = None):
        """Загружает все .json файлы из папки locales.

        По умолчанию ищет папку locales рядом с корнем проекта,
        независимо от того, из какой директории запущен скрипт.
        """
        if locales_dir is None:
            # Путь <project_root>/locales
            project_root = os.path.dirname(os.path.dirname(__file__))
            locales_dir = os.path.join(project_root, "locales")

        # Проверка, чтобы не падало, если папки нет
        if not os.path.exists(locales_dir):
            logging.warning(f"⚠️ Папка {locales_dir} не найдена. Пропускаем загрузку.")
            return

        for entry in os.listdir(locales_dir):
            lang_dir = os.path.join(locales_dir, entry)
            # Убедимся, что это директория языка (например 'ru')
            if not os.path.isdir(lang_dir) or entry.startswith('.') or entry == '__pycache__':
                continue
                
            lang_code = entry
            if lang_code not in self.locales:
                self.locales[lang_code] = {}

            # Ищем .json файлы внутри папки языка
            for filename in os.listdir(lang_dir):
                if filename.endswith(".json"):
                    filepath = os.path.join(lang_dir, filename)
                    
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            # Сливаем данные, предупреждая о дубликатах ключей
                            for key, value in data.items():
                                if key in self.locales[lang_code]:
                                    logging.warning(f"⚠️ Дублирование ключа '{key}' в {filename} для языка {lang_code}. Ключ будет перезаписан.")
                                self.locales[lang_code][key] = value
                    except Exception as e:
                        logging.error(f"❌ Ошибка загрузки файла {filename} для {lang_code}: {e}")
                        
            logging.info(f"✅ Локаль загружена: {lang_code} ({len(self.locales[lang_code])} ключей)")

    def get(self, key: str, lang: str = "ru", **kwargs) -> str:
        """Возвращает текст по ключу."""
        lang_data = self.locales.get(lang, self.locales.get(self.default_lang, {}))
        text = lang_data.get(key, key)
        
        if kwargs:
            try:
                return text.format(**kwargs)
            except (KeyError, ValueError):
                return text
        return text

# Создаем один экземпляр на весь проект
i18n = I18n()

def safe_emoji(emoji_str: str) -> str | None:
    """Безопасно извлекает ID эмодзи. 
    Если ключ перевода не найден (возвращается само имя ключа с буквами), возвращает None.
    """
    if emoji_str and emoji_str.isdigit():
        return emoji_str
    return None