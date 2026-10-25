@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo [Error] Node.js/npm was not found. Install Node.js and try again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [Error] Dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting PaperSkill at http://127.0.0.1:5177/
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:5177/"
call npm run dev -- --host 127.0.0.1 --port 5177 --strictPort

if errorlevel 1 (
  echo [Error] PaperSkill failed to start.
  pause
  exit /b 1
)
