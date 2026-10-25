@echo off
cd /d "%~dp0"
if not exist "node_modules\.bin\vite.cmd" (
  echo Dependencies are missing. Please run: npm install
  pause
  exit /b 1
)
start "DarkISP local server" /min cmd /k "npm run dev -- --host 127.0.0.1 --port 5178 --strictPort"
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:5178/"
