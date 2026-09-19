# Архитектурная карта проекта

## Назначение и границы проекта

`trading-bot` — Telegram-first приложение для онбординга пользователей, просмотра рыночных данных и новостей, поддержки, управления профилем, демонстрационной торговли и локального TON-кошелька. Репозиторий объединяет:

- Telegram-бот на aiogram;
- FastAPI API, Telegram webhook и раздачу собранных SPA/медиа;
- React WebApp для Telegram Mini App;
- общие конфигурацию, локализацию, модели, репозитории и lifecycle;
- PostgreSQL, Redis и Docker/Caddy-инфраструктуру.

В текущих границах реальные биржевые ордера не исполняются. Backend `POST /api/trade/order` возвращает отдельный симулированный ответ, но WebApp его не вызывает: криптотерминал содержит собственный клиентский paper-trading engine, хранит демо-счёт в `localStorage` и получает цены только из детерминированного mock stream. TON-кошелёк также работает на клиенте и напрямую взаимодействует с TON/TonAPI. Исходники административного SPA в текущем рабочем дереве отсутствуют, хотя backend, Docker и CI ожидают каталог `admin/`.

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
- Zustand — состояние приложения, i18n, кошелька, торгового UI и отдельного paper-trading account/store.
- Axios — клиент `/api`; Telegram Mini App SDK используется через `window.Telegram.WebApp`.
- `@ton/core`, `@ton/crypto`, `@ton/ton` — локальный TON wallet flow и транзакции.
- `lightweight-charts` — canvas-график локально сгенерированных свечей/area series; `react-qr-code` — адреса получения средств.
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
| `webapp/src/main.tsx`, `App.tsx` | Bootstrap React/ErrorBoundary, проверка Telegram host, верхнеуровневая навигация и полноэкранные feature overlays. |
| `webapp/src/pages/` | Feature-модули Mini App: `home`, `wallet`, `trade`, `support`, `profile`. |
| `webapp/src/pages/trade/components/Crypto/` | Клиентский фьючерсный демо-терминал: UI/draft store, чистый доменный слой расчётов и валидации, paper-trading engine/store, mock market stream, `localStorage` persistence, заявки, позиции, история и график. |
| `webapp/src/pages/trade/components/Crypto/domain/` | Типы и чистые функции для размера/маржи/комиссий/PnL/ликвидации, валидации заявок, частичного закрытия и преобразования TP/SL. |
| `webapp/src/pages/trade/components/Crypto/engine/` | Детерминированный генератор тиков и переходы paper-trading snapshot: fills, netting/reversal, reduce-only reconciliation, ledger и account aggregation. |
| `webapp/src/api/`, `hooks/` | Axios-контракт backend API, Telegram bridge, news cache, BackButton stack и пока не подключённые Binance WebSocket hooks. |
| `webapp/src/store/`, `i18n/` | Глобальное Zustand-состояние app/wallet/language и переводы WebApp для `ru`, `en`, `ua`. |
| `webapp/src/shared/`, `utils/` | Layout/UI/animation primitives, pull-to-refresh, haptics, client-side cryptography и прямые TonAPI/TON операции. |
| `tests/` | Pytest unit/integration/import/API-contract/migration tests; БД-тесты используют SQLite. |
| `webapp/tests/` | Node test runner: trade UI store, paper-trading store/engine, доменные расчёты, mock chart/random, pull-to-refresh и согласованность переводов. |
| `docker/` | Compose, Dockerfiles и Caddy reverse proxy. |
| `.github/workflows/` | Production build/deploy workflow. |
| `scripts/` | Операционные и диагностические утилиты; не являются runtime-слоем приложения. |
| `uploads/` | Локальное хранилище загруженных изображений/видео, раздаваемое FastAPI через `/uploads`. |

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

#### Bootstrap, Telegram host и навигация

`main.tsx` монтирует `App` внутри `ErrorBoundary`. `useWebApp` ожидает Telegram SDK, вызывает `ready()`/`expand()`, задаёт чёрный header/background, отключает vertical swipes на мобильных Telegram-платформах и блокирует browser back через history. В production UI доступен только при наличии Telegram `initData`/WebView proxy; Vite dev mode пропускает эту границу.

Отдельного router library нет:

- `App.tsx` держит активную вкладку локально: `home`, `wallet`, `trade`, `support`, `profile`;
- `useAppStore.activeMarket` открывает поверх shell полноэкранные `CryptoScreen`, `ScreenerScreen` или `DiaryScreen`;
- `MobileLayout` использует нижнюю навигацию, `DesktopLayout` — верхнюю; переключение связано с пользовательским `isFullscreen` в store, а не с URL;
- `useBackButton` поддерживает module-level LIFO stack обработчиков, поэтому Telegram BackButton закрывает верхний активный экран/модалку;
- `BottomSheet`, Framer Motion и `AnimatePresence` образуют общий overlay/navigation pattern;
- `PullToRefresh` перехватывает вертикальный touch-жест только в верхней позиции scroll container, применяет resistance/threshold и Telegram haptics. Он используется на Home, terminal и chart screens.

#### Состояние WebApp

| Слой | Данные и время жизни |
| --- | --- |
| `useAppStore` | Telegram user/profile nickname, UI-fullscreen flag, home tiles cache и текущий trade overlay; память процесса вкладки. |
| `useI18nStore` | Язык `ru`/`en`/`ua`; сохраняется в `localStorage` под `app_language`, при первом запуске выводится из языка Telegram. |
| `useWalletStore` | Wallet address и только зашифрованный mnemonic; Zustand persist пишет в Telegram CloudStorage с зеркалом/fallback в `localStorage`. Балансы и цена остаются runtime state. |
| `useCryptoStore` | Draft/UI терминала: instrument map и mock tick counter, symbol/favorites, open/close intent, type/price/unit/amount, leverage/margin/TP-SL, tabs, overlays и toast. |
| `usePaperTradingStore` | Демо-счёт с начальным балансом 5300: orders, fills, one-way positions, ledger, realized PnL и paid fees; выполняет place/cancel/close/TP-SL/tick/reset actions. |
| `useDemoPersistence` | При входе восстанавливает часть UI и весь paper snapshot из `localStorage` `crypto_terminal_demo_v1`; изменения обоих trade stores сохраняются с debounce 150 мс. |
| Локальный React state | Верхнеуровневая вкладка, открытые feature-модалки, wallet state machine, news selection/filter и chart timeframe/type. |
| Module cache | `useNews` держит crypto/forex новости 5 минут; pull-to-refresh инвалидирует выбранную категорию. |

#### Backend API и внешние запросы

`api/client.ts` создаёт Axios client с base URL `VITE_API_URL || /api`, timeout 10 секунд и перед каждым запросом добавляет `Authorization: tma <initData>`. Текущий frontend-контракт включает только:

- `/users/me` — nickname/профиль;
- `/home/layout` — динамические home tiles;
- `/news/crypto`, `/news/forex`, `/news/article` — ленты и содержимое статьи;
- `/support/my-ticket`, `/support/ticket/{id}/message|close` — пользовательская поддержка.

Support hook создаёт тикет при первом 404 и обновляет переписку polling-ом каждые 5 секунд. Wallet обходится без backend: native `fetch`/Axios обращаются прямо к TonAPI для балансов, rates, событий, seqno, jetton wallet и отправки подписанного BOC.

Backend предоставляет `/api/charts/crypto/symbols`, `/api/charts/crypto/ohlcv/{symbol}` и paper-trade `/api/trade/order`, но текущий WebApp их не вызывает. `useBinanceMarket.ts` содержит hooks для публичных Binance ticker/depth/kline WebSocket streams, однако в текущем component graph они не используются.

#### Feature-потоки

- **Home:** category `all` показывает динамические tiles из БД; `forex`/`crypto` загружают RSS-агрегацию через backend. Tile может открыть Telegram link, раскрываемые блоки или modal; статья догружается отдельным запросом. Прочитанные news IDs хранятся на клиенте.
- **Support:** при входе загружается/создаётся активный тикет, сообщения синхронизируются polling-ом, отправка и закрытие идут через защищённый API; admin routes обслуживают противоположную сторону очереди.
- **Profile:** показывает локальные settings/about/notifications screens. Язык и UI-layout меняются локально; Telegram/document fullscreen управляется отдельным SDK/browser API потоком. Security/referrals в WebApp пока отображают уведомление о разработке.
- **Wallet:** state machine ведёт пользователя через создание/импорт 24-word mnemonic, backup, установку/проверку PIN, dashboard, receive/send/settings/token details. Mnemonic шифруется в браузере PBKDF2-SHA-512 (1 000 000 iterations, random salt) + AES-256-GCM; поддерживается расшифровка legacy V1. При отправке seed временно расшифровывается, TON Wallet V4R2 подписывает external message, а BOC уходит в TonAPI. Backend seed не получает.
- **Trade hub:** открывает crypto terminal, screener или diary overlay. Screener и diary сейчас являются presentation placeholders.
- **Crypto terminal:** `useCryptoStore` связывает order form, open/close intent, margin/leverage/unit/TP-SL modals, symbol/favorites selector, header, synthetic order book и нижние tabs. `domain/` считает quantity/notional/margin/fee/PnL/liquidation и валидирует instrument/step/minimum/balance/price band/reduce-only limits. `usePaperTradingStore` выполняет market и limit orders, резервирует margin, создаёт fills, сводит противоположные заявки в one-way position, поддерживает reversal, cancel/cancel-all, частичное и полное закрытие, редактирование TP/SL, realized/unrealized PnL, fees и ledger. Orders, positions и history tabs читают это состояние напрямую.
- **Mock execution loop:** `useMockDataEngine` раз в секунду вызывает детерминированный `useCryptoStore.tick()`, строит prices/specs и передаёт их в `processMarketTick`. Тик обновляет mark/PnL, исполняет пересечённые limit orders и закрывает позиции при TP, SL или расчётной ликвидации. Close/reduce-only заявки не могут открыть обратную позицию; устаревшие close orders автоматически согласуются с оставшимся объёмом.
- **Trade persistence:** `useDemoPersistence` восстанавливает favorites/leverage/margin/unit и paper account из versioned `localStorage`; некорректный snapshot игнорируется. Это локальная демо-персистентность вкладки, не синхронизация с backend или биржей.
- **Chart:** отдельный overlay использует `lightweight-charts`, переключает candlestick/area series и timeframe UI. `chartGenerator.ts` создаёт 200 детерминированных mock candles вокруг текущей mock-цены; выбранный timeframe задаёт Unix-шаг от `1s` до `3M`, но данные не запрашиваются у backend.

#### Сборка и проверки WebApp

Vite публикует приложение с `base: /webapp/`; dev server проксирует `/api` на `localhost:8000`. TypeScript работает в strict/no-unused режиме. `npm run lint` — локальный AST-check только для trade subtree и `BottomSheet` (запрещает user-facing Cyrillic и `console`), а не универсальный ESLint. Node tests проверяют crypto store, pull-to-refresh math и целостность trade/common переводов. Python API-contract test отдельно сопоставляет строковые frontend calls с зарегистрированными FastAPI routes.

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
- Zustand разделён на app, i18n, wallet, crypto UI/draft и paper-trading stores. Язык и wallet metadata/ciphertext используют свои persist-механизмы; trade UI subset и paper snapshot сохраняются вручную в versioned `localStorage`.
- Backend news service и frontend `useNews` имеют независимые process/module-local TTL caches.
- `uploads/` хранит медиа на локальной файловой системе; `bot_media.tg_file_id` уменьшает повторные Telegram uploads.

### Авторизация

- User API принимает только Telegram Mini App `initData`; backend проверяет HMAC и возраст данных, после чего использует Telegram user ID.
- Admin API принимает либо Telegram initData, либо подписанный `Admin <token>` с TTL 24 часа. В обоих случаях ID должен входить в `ADMIN_IDS`.
- Обычный browser login администратора сверяет `ADMIN_PASSWORD`; Redis ограничивает попытки по IP и Telegram ID.
- Telegram webhook проверяет `X-Telegram-Bot-Api-Secret-Token`, детерминированно полученный из bot token.
- Wallet mnemonic не отправляется backend: он шифруется в браузере через PBKDF2-SHA-512/AES-GCM; транзакция подписывается на клиенте.

## Внешние интеграции

- Telegram Bot API и Telegram Mini App API/CloudStorage.
- Binance public REST API используется backend market-data routes; optional encrypted exchange key передаётся в OHLCV request. Frontend WebSocket hooks реализованы, но пока не подключены к торговому экрану.
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
- Реальная торговля и серверное хранение wallet seed в текущую архитектуру не входят. Backend order endpoint и клиентский paper engine — два независимых симулятора; текущий frontend terminal не вызывает `/api/trade/order`.
- Торговый UI отделён от market-data backend: instruments, ticker, order book, trades и chart генерируются локально. Paper orders и positions функциональны только внутри локального демо-счёта и не являются данными биржи.
- Paper engine использует one-way position на symbol; противоположный open order сначала уменьшает текущую позицию и может развернуть остаток. Close intent/reduce-only ограничен незарезервированным объёмом позиции.

## Компактная схема ключевых узлов

Зафиксировано 26 архитектурных узлов:

```text
[1 Telegram users]
   ├─ updates ─> [2 Bot runtime] ─> [3 Middleware + handler graph]
   │                                      ├─> [7 Shared services/config]
   │                                      ├─> [8 Data access layer] ─> [9 PostgreSQL]
   │                                      └─> [10 Redis]
   └─ Mini App ─> [11 React bootstrap]
                      ├─ host bridge ─> [12 Telegram WebApp APIs]
                      └─> [13 Navigation/layout + BackButton stack]
                              └─> [14 Feature pages/overlays]
                                      ├─> [15 App/i18n state]
                                      ├─> [16 API client + caches] ── tma HTTP ─> [4 FastAPI app]
                                      ├─> [17 Trade UI/draft store]
                                      │       ├─> [18 Domain calculations/validation]
                                      │       ├─ actions ─> [19 Paper engine/store]
                                      │       │                 └─ snapshot ─> [20 Demo localStorage]
                                      │       └─ ticks ─> [21 Mock market/chart data]
                                      │                         └─ prices/specs ─> [19 Paper engine/store]
                                      └─> [22 Wallet state + client cryptography] ─> [23 TonAPI/TON]

[4 FastAPI app]
   ├─> [5 API route modules] ─> [8 Data access layer]
   ├─ Telegram lifecycle ─> [6 Webhook bridge] ─> [3 Middleware + handler graph]
   ├─ news/market requests ─> [24 Market/news providers]
   ├─ static/media ─> [25 Uploads + built SPA]
   └─ served via ─> [26 Docker/Caddy/CI deployment]
```

## Неизвестные или намеренно не исследованные области

- Каталог `admin/` отсутствует в текущем checkout, хотя backend, Compose и deploy workflow на него ссылаются; его frontend architecture не картирована.
- Содержимое `.env`, `.secret/`, production credentials и внешнее состояние PostgreSQL/Redis намеренно не читались.
- Вспомогательные `scripts/` не анализировались как runtime-код.
- Каждый handler, React component, migration и тест не читался: карта отражает архитектурный каркас, а не code review.
- Фактическая production topology Oracle Cloud, backup/restore, observability и доступность сторонних API не проверялись.
- Раздел paper trading отражает текущие незакоммиченные изменения рабочего дерева поверх commit `5059b2d`; их production deployment не проверялся.
