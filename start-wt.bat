@echo off
setlocal

:: Ngrok domain (set in .env or override here)
if not defined NGROK_DOMAIN (
    for /f "tokens=1,2 delims==" %%a in ('findstr /R "^NGROK_DOMAIN=" "%~dp0.env" 2^>nul') do set "NGROK_DOMAIN=%%b"
)
if not defined NGROK_DOMAIN set "NGROK_DOMAIN=your-domain.ngrok-free.dev"

echo Starting bot + backend + webapp...
echo.

taskkill /IM ngrok.exe /F >nul 2>&1
ping 127.0.0.1 -n 3 >nul
taskkill /IM ngrok.exe /F >nul 2>&1

:: Start Redis if not already running
tasklist /FI "IMAGENAME eq redis-server.exe" | find /I "redis-server.exe" >nul 2>&1
if errorlevel 1 (
    echo Starting Redis...
    start "" /B "C:\Redis\redis-server.exe" "C:\Redis\redis.windows.conf"
    ping 127.0.0.1 -n 2 >nul
    echo Redis started.
) else (
    echo Redis already running.
)

:: Примечание по режимам бота:
::   `python -m bot.main` запускает polling, НО только если в .env НЕ задан
::   WEBHOOK_BASE_URL. Если WEBHOOK_BASE_URL есть (что у нас и настроено
::   через ngrok) — bot.main сам тихо выйдет с сообщением в лог, а апдейты
::   Telegram будет принимать `backend/bot_webhook.py` в FastAPI.
::   Таким образом одновременный запуск polling+webhook невозможен — конфликтов нет.

wt -w 0 ^
  new-tab --title "Bot (auto: polling/webhook)" cmd /k "cd /d %~dp0 && python -m bot.main" ^
; new-tab --title "Backend (API+Static) :8000" cmd /k "cd /d %~dp0 && ping 127.0.0.1 -n 3 >nul && uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 --reload-exclude node_modules --reload-exclude .git" ^
; new-tab --title "WebApp DEV (5173)" cmd /k "cd /d %~dp0webapp && ping 127.0.0.1 -n 6 >nul && npm run dev" ^
; new-tab --title "Admin DEV (5175)" cmd /k "cd /d %~dp0admin && ping 127.0.0.1 -n 6 >nul && npm run dev" ^
; new-tab --title "Ngrok (8000)" cmd /k "ping 127.0.0.1 -n 9 >nul && ngrok http 8000"

echo.
echo Services started:
echo - Redis: localhost:6379
echo - Bot: auto-mode (polling if WEBHOOK_BASE_URL empty, webhook via Backend otherwise)
echo - Backend (API + Static): http://localhost:8000
echo - WebApp DEV: http://localhost:5173
echo - Admin DEV: http://localhost:5175
echo - Ngrok: https://%NGROK_DOMAIN%/
echo.
echo Production URLs:
echo - WebApp: https://%NGROK_DOMAIN%/webapp/
echo - Admin: https://%NGROK_DOMAIN%/admin/
echo - API: https://%NGROK_DOMAIN%/api/
echo - Bot webhook: https://%NGROK_DOMAIN%/api/telegram/webhook
echo.
exit /b 0
