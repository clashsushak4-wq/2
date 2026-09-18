# Архитектурная карта проекта

## Назначение и границы проекта

`trading-bot` — Telegram-first приложение для онбординга пользователей, просмотра рыночных данных и новостей, поддержки, управления профилем, демонстрационной торговли и локального TON-кошелька. Репозиторий объединяет:

- Telegram-бот на aiogram;
- FastAPI API, Telegram webhook и раздачу собранных SPA/медиа;
- React WebApp для Telegram Mini App;
- общие конфигурацию, локализацию, модели, репозитории и lifecycle;
- PostgreSQL, Redis и Docker/Caddy-инфраструктуру.

В текущих границах реальные биржевые ордера не исполняются: `POST /api/trade/order` возвращает результат симулированной paper-trade операции. TON-кошелёк работает на клиенте и напрямую взаимодействует с TON/TonAPI. Исходники административного SPA в текущем рабочем дереве отсутствуют, хотя backend, Docker и CI ожидают каталог `admin/`.

## Стек и ключевые зависимости

### Backend и бот

- Python 3.11 в Docker.
- aiogram 3.4+ — Telegram polling/webhook, routers, FSM и middleware.
- FastAPI 0.109+ и Uvicorn 0.27+ — HTTP API, webhook, static/SPA serving.
- SQLAlchemy 2+, asyncpg и Alembic 1.13+ — асинхронный слой данных и миграции.
- PostgreSQL 15 — постоянные данные; Redis 7 — FSM, throttling, языковой кэш и rate limit админского входа.
- Pydantic Settings — конфигурация из окружения; Loguru — общий logging bridge.
- aiohttp, feedparser, BeautifulSoup и lxml — Binance/RSS/article integrations.
- Fernet из `cryptography` — шифрование биржевых API credentials.

### WebApp

- React 18.3, TypeScript, Vite 5, Tailwind CSS и Framer Motion.
- Zustand — состояние приложения, торгового интерфейса и кошелька.
- Axios — клиент `/api`; Telegram Mini App SDK используется через `window.Telegram.WebApp`.
- `@ton/core`, `@ton/crypto`, `@ton/ton` — локальный TON wallet flow и транзакции.
- CI собирает frontend под Node.js 20.

### Инфраструктура

- Docker Compose: `postgres`, `redis`, `bot`, `backend`, `caddy`.
- Caddy завершает TLS и проксирует публичный домен на FastAPI.
- GitHub Actions собирает WebApp/Admin и разворачивает приложение на Oracle Cloud при push в `main`.

## Структура модулей и ответственность директорий

| Путь | Ответственность |
| --- | --- |
| `bot/` | aiogram runtime: фабрики Bot/Dispatcher/storage, middleware, FSM states, handlers и Telegram UI. |
| `bot/handlers/` | Иерархия router-ов: common/onboarding, profile, info, trading, education и последний fallback `unknown`. |
| `backend/` | FastAPI приложение, API routes, Telegram webhook, auth/security, market data и news service. |
| `backend/api/routes/` | Auth, users, support, home layout, news, uploads, charts, exchanges, bot media, trade и broadcast endpoints. |
| `shared/` | Общие настройки, lifecycle, константы, i18n, cache/logger/validation и cryptography service. |
| `shared/database/` | Async SQLAlchemy engine/session, ORM models, repository layer и Alembic migrations. |
| `shared/locales/` | JSON-переводы Telegram-бота для `ru`, `en`, `ua`, `tr`. |
| `webapp/src/` | React Mini App: страницы, layouts/UI, hooks, API client, i18n, Zustand stores и TON utilities. |
| `tests/` | Pytest unit/integration/import/API-contract/migration tests; БД-тесты используют SQLite. |
| `webapp/tests/` | Node test runner: состояние crypto UI и согласованность переводов. |
| `docker/` | Compose, Dockerfiles и Caddy reverse proxy. |
| `.github/workflows/` | Production build/deploy workflow. |
| `scripts/` | Операционные и диагностические утилиты; не являются runtime-слоем приложения. |
| `uploads/` | Локальное хранилище загруженных изображений/видео, раздаваемое FastAPI через `/uploads`. |
| `audit/` | Существующие отчёты и план исправлений; не является исполняемым кодом. |

Локальные `.venv/`, `webapp/node_modules/`, `webapp/dist/`, `.secret/` и `.env*` не входят в архитектурный источник истины.

## Точки входа, роутинг и основные пользовательские потоки

### Точки входа

1. `python -m bot.main` запускает polling. Если задан `WEBHOOK_BASE_URL`, polling намеренно не стартует, чтобы не конфликтовать с webhook.
2. `uvicorn backend.main:app` запускает API. Lifespan создаёт aiogram Bot/Dispatcher и регистрирует Telegram webhook; `POST /api/telegram/webhook` проверяет secret header и передаёт update в Dispatcher.
3. `webapp/src/main.tsx` монтирует React, а `App.tsx` управляет state-driven вкладками без отдельного router library.
4. Caddy проксирует внешний HTTPS-трафик в backend; FastAPI раздаёт `webapp/dist`, `admin/dist` при наличии и `uploads/`.

### Telegram-бот

`bot.core.factory` строит storage с Redis и fallback на MemoryStorage, затем регистрирует middleware в порядке: logging → DB session → i18n → auth → admin check → throttling → root router.

Root router подключает `common`, `profile`, `info`, `trading`, `education`, затем fallback. Поток `/start`:

1. найти или создать пользователя по Telegram ID;
2. обработать referral argument;
3. для нового пользователя запросить язык и nickname через FSM;
4. для завершившего onboarding показать главное меню и ссылки на разделы/WebApp.

### FastAPI

Основные группы маршрутов:

- `/api/auth`, `/api/users` — Telegram auth/profile;
- `/api/support` — пользовательские и административные тикеты;
- `/api/home`, `/api/news` — динамический home layout и новости;
- `/api/charts`, `/api/trade` — Binance market data и paper trading;
- `/api/admin/auth`, `/api/admin/exchanges`, `/api/admin/bot-media`, `/api/admin/bot/broadcast` — административные функции;
- `/api/uploads`, `/uploads` — загрузка и раздача медиа;
- `/api/telegram/webhook` — Telegram update ingress;
- `/health` — health check.

### WebApp

WebApp разрешает production UI только внутри Telegram, извлекает `initData`, отправляет его как `Authorization: tma <initData>` и загружает профиль из `/api/users/me`. Основные вкладки: home, wallet, trade, support, profile. Внутри trade открываются crypto, screener и diary screens; навигация хранится в React/Zustand state.

Ключевые пользовательские потоки:

- Home: API layout + RSS news/article content.
- Support: создание активного тикета, сообщения и закрытие; admin endpoints обслуживают очередь тикетов.
- Trade: список символов/OHLCV от Binance и live WebSocket ticker/order book/kline; отправка ордера пока симулируется.
- Wallet: генерация/импорт mnemonic, клиентское AES-GCM шифрование по PIN, хранение ciphertext в Telegram CloudStorage с fallback на `localStorage`, чтение балансов/истории и отправка BOC через TonAPI.

## Потоки данных, состояние, API, база данных и авторизация

### Данные и транзакции

- `shared.config.Settings` загружается из `.env` и содержит Telegram, DB/Redis, URLs, режим торговли и security settings. Секреты представлены `SecretStr` там, где это предусмотрено моделью.
- И bot middleware, и FastAPI dependency создают `AsyncSession`, коммитят успешную операцию и откатывают исключение.
- Repository layer изолирует запросы к ORM-моделям.
- Актуальная Alembic head: `9404acc3bc9d`; схема управляется миграциями, а не `create_all` в production.

Постоянные модели:

- `users` — Telegram identity, nickname/language/preferences и referral/support metadata;
- `exchanges` — зашифрованные API key/secret и active flag;
- `home_tiles` — тип, размер, порядок, видимость и JSON content;
- `tickets`, `ticket_messages` — поддержка и история диалога;
- `bot_media` — media slots, file/thumb URLs и Telegram `file_id` cache.

### Состояние

- Redis хранит aiogram FSM, distributed throttling, 24-hour language cache и временные login counters. При недоступности Redis бот использует in-memory FSM, но распределённость состояния теряется.
- Zustand хранит текущего пользователя, layout state, активный рынок, trading UI и wallet metadata.
- Новостной сервис использует process-local TTL caches.
- `uploads/` хранит медиа на локальной файловой системе; `bot_media.tg_file_id` уменьшает повторные Telegram uploads.

### Авторизация

- User API принимает только Telegram Mini App `initData`; backend проверяет HMAC и возраст данных, после чего использует Telegram user ID.
- Admin API принимает либо Telegram initData, либо подписанный `Admin <token>` с TTL 24 часа. В обоих случаях ID должен входить в `ADMIN_IDS`.
- Обычный browser login администратора сверяет `ADMIN_PASSWORD`; Redis ограничивает попытки по IP и Telegram ID.
- Telegram webhook проверяет `X-Telegram-Bot-Api-Secret-Token`, детерминированно полученный из bot token.
- Wallet mnemonic не отправляется backend: он шифруется в браузере через PBKDF2-SHA-512/AES-GCM; транзакция подписывается на клиенте.

## Внешние интеграции

- Telegram Bot API и Telegram Mini App API/CloudStorage.
- Binance public REST API и WebSocket streams; optional encrypted exchange key используется для OHLCV request.
- TonAPI и TON libraries для балансов, истории, wallet contract и отправки транзакций.
- RSS источники CoinDesk, CoinTelegraph, Bitcoin Magazine, Decrypt, ForexLive, FXStreet и MarketWatch; article pages обрабатываются BeautifulSoup.
- PostgreSQL и Redis.
- Caddy, Docker, GitHub Actions, Oracle Cloud и локальный ngrok workflow.

## Команды разработки и проверки

Из корня репозитория:

```powershell
# Python окружение
python -m pip install -r requirements.txt
alembic upgrade head

# Polling-режим бота (только без WEBHOOK_BASE_URL)
python -m bot.main

# Backend + webhook/static
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Python checks
pytest
pytest -m "not slow"
```

Из `webapp/`:

```powershell
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Контейнерный запуск: `docker compose -f docker/docker-compose.yml up -d --build`. Windows-скрипт `start-wt.bat` поднимает bot/backend/WebApp/ngrok в отдельных вкладках Windows Terminal и имеет внешние побочные эффекты, поэтому не является проверочной командой.

## Архитектурные соглашения и важные ограничения

- Polling и webhook взаимоисключающие; `WEBHOOK_BASE_URL` переключает production webhook mode.
- Общие DB/config/i18n/lifecycle компоненты находятся в `shared/`; API routes импортируют auth/session dependencies из `backend.core.deps`.
- Router order бота значим: fallback должен оставаться последним; middleware order определяет наличие session, локализации и auth context.
- Все изменения схемы выполняются Alembic migrations.
- Admin/exchange/media/broadcast endpoints защищаются admin dependency; user endpoints — Telegram initData dependency.
- API и React связаны contract test-ом, который сопоставляет frontend calls и backend routes.
- Внешние network integrations должны рассматриваться как отказоустойчивые границы; news и market-data routes преобразуют ошибки провайдеров в контролируемые ответы/fallbacks.
- Uploaded files и frontend dist — runtime/build artifacts, не источник истины.
- Реальная торговля и серверное хранение wallet seed в текущую архитектуру не входят.

## Компактная схема ключевых узлов

Зафиксировано 16 архитектурных узлов:

```text
[1 Telegram users]
   ├─ updates ─> [2 Bot runtime] ─> [3 Middleware + handler graph]
   │                                      ├─> [8 Shared services/config]
   │                                      ├─> [9 Data access layer] ─> [10 PostgreSQL]
   │                                      └─> [11 Redis]
   └─ Mini App ─> [12 React WebApp] ─> [13 Frontend state/API client]
                         │                         ├─ tma/admin HTTP ─> [4 FastAPI app]
                         │                         └─ live market ─> [14 Market/news providers]
                         └─ wallet ─> [15 Client TON wallet/TonAPI]

[4 FastAPI app]
   ├─> [5 API route modules] ─> [9 Data access layer]
   ├─ Telegram lifecycle ─> [6 Webhook bridge] ─> [3 Middleware + handler graph]
   ├─ static/media ─> [7 Uploads + built SPA]
   └─ served via ─> [16 Docker/Caddy/CI deployment]
```

## Неизвестные или намеренно не исследованные области

- Каталог `admin/` отсутствует в текущем checkout, хотя backend, Compose и deploy workflow на него ссылаются; его frontend architecture не картирована.
- Содержимое `.env`, `.secret/`, production credentials и внешнее состояние PostgreSQL/Redis намеренно не читались.
- `audit/` reports и все вспомогательные `scripts/` не анализировались как исходный код.
- Каждый handler, React component, migration и тест не читался: карта отражает архитектурный каркас, а не code review.
- Фактическая production topology Oracle Cloud, backup/restore, observability и доступность сторонних API не проверялись.
