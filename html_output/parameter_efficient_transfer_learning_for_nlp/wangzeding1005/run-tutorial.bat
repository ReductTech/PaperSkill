@echo off
setlocal
chcp 65001 >nul
title Parameter-Efficient Transfer Learning Tutorial

cd /d "%~dp0"

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Install Node.js, then run this file again.
  pause
  exit /b 1
)

set "APP_URL=http://127.0.0.1:5173/"

powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri '%APP_URL%' -TimeoutSec 1; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; exit 1" >nul 2>&1
if not errorlevel 1 (
  echo The tutorial is already running at %APP_URL%
  if /I not "%PAPERSKILL_NO_BROWSER%"=="1" start "" "%APP_URL%"
  exit /b 0
)

if not exist "node_modules\" (
  echo Installing project dependencies...
  set "npm_config_cache=%TEMP%\paper-skill-npm-cache"
  call npm ci
  if errorlevel 1 (
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
  )
)

if /I not "%PAPERSKILL_NO_BROWSER%"=="1" (
  start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "$url = '%APP_URL%'; for ($i = 0; $i -lt 120; $i++) { try { $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1; if ($response.StatusCode -eq 200) { Start-Process $url; exit 0 } } catch {}; Start-Sleep -Milliseconds 500 }"
)

echo Starting tutorial at %APP_URL%
echo Keep this window open. Press Ctrl+C to stop the server.
echo.

call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] The tutorial server stopped with exit code %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
