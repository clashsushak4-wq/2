# Документация по деплою: Oracle Cloud

В этом файле собрана вся необходимая информация для подключения, управления и деплоя бота на сервере Oracle Cloud.

## Основные данные сервера

*   **IP-адрес:** `138.2.175.223`
*   **Имя пользователя:** `ubuntu`
*   **SSH Ключ:** `.secret/ssh-key-2026-05-22.key` (лежит в корне проекта локально)
*   **Домен:** `sdtxtrx.duckdns.org`
*   **Директория проекта на сервере:** `/home/ubuntu/bot`

## Архитектура деплоя

Проект крутится на сервере через **Docker Compose** (`docker-compose.yml` в папке `docker/`).
Запущенные контейнеры:
1.  `trading_caddy` — веб-сервер, который работает как Reverse Proxy для бэкенда.
2.  `trading_backend` — FastAPI бэкенд (отвечает на запросы API, а также **раздает статические файлы фронтенда** webapp и admin).
3.  `trading_bot` — сам Telegram бот (Aiogram).
4.  `trading_bot_db` — база данных PostgreSQL 15.
5.  `trading_bot_redis` — Redis для кеширования и очередей.

> [!IMPORTANT]
> Фронтенд (WebApp и Admin Panel) **НЕ** хостится на Firebase! Файлы фронтенда компилируются локально, загружаются на сервер Oracle, и бэкенд (FastAPI) раздает их по путям `https://sdtxtrx.duckdns.org/webapp` и `https://sdtxtrx.duckdns.org/admin`.

## Полезные команды

### 1. Подключение по SSH
```bash
ssh -i .secret/ssh-key-2026-05-22.key ubuntu@138.2.175.223
```

### 2. Обновление Python-кода (Бэкенд и Бот)
Код обновляется через вытягивание изменений из Git и перезапуск контейнеров.
```bash
# Выполнять по SSH на сервере:
cd /home/ubuntu/bot
git pull origin main
cd docker
docker-compose up -d --build
```
*(Важно: использовать `docker-compose up -d`, а не `restart`, чтобы контейнеры пересоздались с новыми настройками .env, если они менялись).*

### 3. Деплой Фронтенда (WebApp и Admin)
Поскольку папки `dist/` находятся в `.gitignore`, их нужно собирать локально и загружать на сервер вручную через `scp`.

**Шаг 1: Локальная сборка**
```bash
cd webapp && npm run build
cd ../admin && npm run build
```

**Шаг 2: Загрузка на сервер (выполнять из корня проекта локально)**
```bash
scp -i .secret/ssh-key-2026-05-22.key -r webapp/dist ubuntu@138.2.175.223:/home/ubuntu/bot/webapp/
scp -i .secret/ssh-key-2026-05-22.key -r admin/dist ubuntu@138.2.175.223:/home/ubuntu/bot/admin/
```

### 4. Просмотр логов
```bash
# Выполнять по SSH на сервере:
cd /home/ubuntu/bot/docker
docker-compose logs --tail=100 -f bot backend
```

## Переменные окружения (.env)
*   Файл `.env` лежит на сервере по пути `/home/ubuntu/bot/.env`.
*   Локальный файл конфигурации для сервера спрятан в папку с секретами: `.secret/.env.oracle_cloud`. Он является точной копией серверного конфигурационного файла. Если нужно изменить настройки на сервере, меняйте их в `.secret/.env.oracle_cloud`, а затем загружайте на сервер:
    ```bash
    scp -i .secret/ssh-key-2026-05-22.key .secret/.env.oracle_cloud ubuntu@138.2.175.223:/home/ubuntu/bot/.env
    ```
