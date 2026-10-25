@echo off
cd /d "%~dp0"
if not exist "node_modules\.bin\vite.cmd" (
  call npm.cmd ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm.cmd run dev -- --host 127.0.0.1 --port 5173 --open
pause
