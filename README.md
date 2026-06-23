

## Структура

├── 📁 admin/                               # 🛠️ Админ-панель (React/Vite)
│   ├── 📁 src/
│   │   ├── 📁 api/                         # API клиент
│   │   ├── 📁 pages/
│   │   │   ├── 📁 constructor/             # Конструктор главной
│   │   │   ├── 📁 exchanges/               # Управление биржами
│   │   │   ├── 📁 login/                   # Страница входа
│   │   │   ├── 📁 media/                   # Управление медиа
│   │   │   ├── 📁 stats/                   # Статистика
│   │   │   └── 📁 support/                 # Поддержка (тикеты)
│   │   ├── 📁 shared/                      # Общие UI компоненты и Layout
│   │   └── 📁 store/                       # Zustand store
│   └── vite.config.ts
│
├── 📁 backend/                             # 🌐 FastAPI Backend
│   ├── 📁 api/
│   │   ├── 📁 routes/
│   │   │   ├── admin_auth.py               # Авторизация админов
│   │   │   ├── auth.py                     # Telegram WebApp авторизация
│   │   │   ├── bot_media.py                # API для медиа бота
│   │   │   ├── charts.py                   # API графиков
│   │   │   ├── exchanges.py                # API бирж
│   │   │   ├── home.py                     # API главной страницы (плитки)
│   │   │   ├── news.py                     # Контроллер новостей
│   │   │   ├── support.py                  # API тикетов поддержки
│   │   │   ├── uploads.py                  # Загрузка файлов
│   │   │   ├── users.py                    # API пользователей
│   │   │   └── webapp_auth.py              # Расширенная авторизация WebApp
│   │   └── 📁 schemas/                     # Pydantic модели запросов/ответов
│   ├── 📁 core/
│   │   ├── database.py                     # Настройка БД (SQLAlchemy)
│   │   ├── deps.py                         # FastAPI зависимости
│   │   ├── market_data.py                  # Логика рыночных данных
│   │   ├── sessions.py                     # Управление сессиями
│   │   └── 📁 security/                    # Валидация и безопасность
│   ├── 📁 services/                        # Бизнес-логика (новости и др.)
│   ├── bot_webhook.py                      # Webhook интеграция бота
│   └── main.py                             # Точка входа FastAPI
│
├── 📁 bot/                                 # 🤖 Telegram бот (aiogram)
│   ├── 📁 filters/                         # Кастомные фильтры (локализация)
│   ├── 📁 handlers/
│   │   ├── 📁 admin/                       # Админ-команды и панель
│   │   ├── 📁 common/                      # Навигация, старт, онбординг
│   │   ├── 📁 education/                   # Раздел «Обучение»
│   │   ├── 📁 info/                        # Информационные команды
│   │   ├── 📁 keyboards/                   # Сборка клавиатур
│   │   ├── 📁 profile/                     # Профиль и настройки пользователя
│   │   └── 📁 trading/                     # Раздел «Trading»
│   ├── 📁 middlewares/                     # БД, i18n, throttling
│   ├── 📁 states/                          # FSM состояния
│   ├── error_handler.py                    # Обработка исключений
│   ├── main.py                             # Запуск бота
│   ├── setup.py                            # Инициализация роутеров
│   ├── utils.py                            # Общие утилиты
│   └── utils_media.py                      # Утилиты для работы с медиа
│
├── 📁 shared/                              # ⚙️ Общий код
│   ├── 📁 database/
│   │   ├── 📁 migrations/                  # Alembic миграции
│   │   ├── 📁 models/                      # SQLAlchemy модели (users, home, support и др.)
│   │   ├── 📁 repo/                        # Репозитории (Data Access Layer)
│   │   └── core.py                         # Конфигурация движка БД
│   ├── 📁 locales/                         # JSON файлы переводов (en, ru, tr, ua)
│   ├── 📁 services/                        # Общие сервисы (криптография)
│   ├── 📁 utils/                           # Логгер, исключения, валидаторы
│   ├── config.py                           # Конфигурация через .env (Pydantic)
│   ├── constants.py                        # Глобальные константы
│   └── lifecycle.py                        # Управление жизненным циклом (startup/shutdown)
│
├── 📁 webapp/                              # 📱 Telegram Mini App (React/Vite)
│   ├── 📁 src/
│   │   ├── 📁 api/                         # Axios клиент
│   │   ├── 📁 hooks/                       # Кастомные хуки (WebApp, News, Wallet)
│   │   ├── 📁 i18n/                        # Конфигурация i18next
│   │   ├── 📁 pages/                       # Home, Profile, Support, Trade, Wallet
│   │   ├── 📁 shared/                      # Layout, UI компоненты, анимации
│   │   ├── 📁 store/                       # Zustand stores (app, wallet)
│   │   └── 📁 utils/                       # Тактильная отдача и др.
│   └── vite.config.ts
│
├── 📁 scripts/                             # 📜 Служебные скрипты
│   ├── check_admin_api.py                  # Проверка API админки
│   ├── check_tiles.py                      # Тестирование плиток
│   └── wipe_db.py                          # Очистка базы данных
│
├── 📁 tests/                               # 🧪 Тестирование (Pytest)
├── 📁 docker/                              # 🐳 Dockerfile и compose
## Структура

├── 📁 admin/                               # 🛠️ Админ-панель (React/Vite)
│   ├── 📁 src/
│   │   ├── 📁 api/                         # API клиент
│   │   ├── 📁 pages/
│   │   │   ├── 📁 constructor/             # Конструктор главной
│   │   │   ├── 📁 exchanges/               # Управление биржами
│   │   │   ├── 📁 login/                   # Страница входа
│   │   │   ├── 📁 media/                   # Управление медиа
│   │   │   ├── 📁 stats/                   # Статистика
│   │   │   └── 📁 support/                 # Поддержка (тикеты)
│   │   ├── 📁 shared/                      # Общие UI компоненты и Layout
│   │   └── 📁 store/                       # Zustand store
│   └── vite.config.ts
│
├── 📁 backend/                             # 🌐 FastAPI Backend
│   ├── 📁 api/
│   │   ├── 📁 routes/
│   │   │   ├── admin_auth.py               # Авторизация админов
│   │   │   ├── auth.py                     # Telegram WebApp авторизация
│   │   │   ├── bot_media.py                # API для медиа бота
│   │   │   ├── charts.py                   # API графиков
│   │   │   ├── exchanges.py                # API бирж
│   │   │   ├── home.py                     # API главной страницы (плитки)
│   │   │   ├── news.py                     # Контроллер новостей
│   │   │   ├── support.py                  # API тикетов поддержки
│   │   │   ├── uploads.py                  # Загрузка файлов
│   │   │   ├── users.py                    # API пользователей
│   │   │   └── webapp_auth.py              # Расширенная авторизация WebApp
│   │   └── 📁 schemas/                     # Pydantic модели запросов/ответов
│   ├── 📁 core/
│   │   ├── database.py                     # Настройка БД (SQLAlchemy)
│   │   ├── deps.py                         # FastAPI зависимости
│   │   ├── market_data.py                  # Логика рыночных данных
│   │   ├── sessions.py                     # Управление сессиями
│   │   └── 📁 security/                    # Валидация и безопасность
│   ├── 📁 services/                        # Бизнес-логика (новости и др.)
│   ├── bot_webhook.py                      # Webhook интеграция бота
│   └── main.py                             # Точка входа FastAPI
│
├── 📁 bot/                                 # 🤖 Telegram бот (aiogram)
│   ├── 📁 filters/                         # Кастомные фильтры (локализация)
│   ├── 📁 handlers/
│   │   ├── 📁 admin/                       # Админ-команды и панель
│   │   ├── 📁 common/                      # Навигация, старт, онбординг
│   │   ├── 📁 education/                   # Раздел «Обучение»
│   │   ├── 📁 info/                        # Информационные команды
│   │   ├── 📁 keyboards/                   # Сборка клавиатур
│   │   ├── 📁 profile/                     # Профиль и настройки пользователя
│   │   └── 📁 trading/                     # Раздел «Trading»
│   ├── 📁 middlewares/                     # БД, i18n, throttling
│   ├── 📁 states/                          # FSM состояния
│   ├── error_handler.py                    # Обработка исключений
│   ├── main.py                             # Запуск бота
│   ├── setup.py                            # Инициализация роутеров
│   ├── utils.py                            # Общие утилиты
│   └── utils_media.py                      # Утилиты для работы с медиа
│
├── 📁 shared/                              # ⚙️ Общий код
│   ├── 📁 database/
│   │   ├── 📁 migrations/                  # Alembic миграции
│   │   ├── 📁 models/                      # SQLAlchemy модели (users, home, support и др.)
│   │   ├── 📁 repo/                        # Репозитории (Data Access Layer)
│   │   └── core.py                         # Конфигурация движка БД
│   ├── 📁 locales/                         # JSON файлы переводов (en, ru, tr, ua)
│   ├── 📁 services/                        # Общие сервисы (криптография)
│   ├── 📁 utils/                           # Логгер, исключения, валидаторы
│   ├── config.py                           # Конфигурация через .env (Pydantic)
│   ├── constants.py                        # Глобальные константы
│   └── lifecycle.py                        # Управление жизненным циклом (startup/shutdown)
│
├── 📁 webapp/                              # 📱 Telegram Mini App (React/Vite)
│   ├── 📁 src/
│   │   ├── 📁 api/                         # Axios клиент
│   │   ├── 📁 hooks/                       # Кастомные хуки (WebApp, News, Wallet)
│   │   ├── 📁 i18n/                        # Конфигурация i18next
│   │   ├── 📁 pages/                       # Home, Profile, Support, Trade, Wallet
│   │   ├── 📁 shared/                      # Layout, UI компоненты, анимации
│   │   ├── 📁 store/                       # Zustand stores (app, wallet)
│   │   └── 📁 utils/                       # Тактильная отдача и др.
│   └── vite.config.ts
│
├── 📁 scripts/                             # 📜 Служебные скрипты
│   ├── check_admin_api.py                  # Проверка API админки
│   ├── check_tiles.py                      # Тестирование плиток
│   └── wipe_db.py                          # Очистка базы данных
│
├── 📁 tests/                               # 🧪 Тестирование (Pytest)
├── 📁 docker/                              # 🐳 Dockerfile и compose
├── alembic.ini                             # Конфиг миграций
├── pytest.ini                              # Конфиг тестов
└── requirements.txt                        # Зависимости Python

## Последние обновления
- Обновлен дизайн Desktop версии WebApp (замена SideNav на TopNav).
- Внедрен многоколоночный Grid-дизайн для всех страниц десктопной версии (Home, Wallet, Trade, Profile, Support).
- Премиальный редизайн ПК версии: идеально ровные отступы, строгая навигация (TopNav с подчеркиванием) и плавные десктопные анимации.

## Разработка (MCP Servers)
Для максимальной эффективности AI-ассистента в данном проекте настроены и рекомендуются следующие MCP серверы:
- **`github-mcp-server`**: Интеграция с репозиторием (коммиты, анализ кода).
- **`@modelcontextprotocol/server-postgres`**: Прямой SQL-доступ к базе данных `trading_bot` (по умолчанию `postgres:1234@localhost:5432/trading_bot`).
- **`@modelcontextprotocol/server-memory`**: Инструмент памяти для сохранения архитектурных правил и предпочтений (граф знаний).
