@echo off
cd /d "%~dp0"
start "" "http://127.0.0.1:5179/"
npm run dev -- --host 127.0.0.1 --port 5179 --strictPort
pause
