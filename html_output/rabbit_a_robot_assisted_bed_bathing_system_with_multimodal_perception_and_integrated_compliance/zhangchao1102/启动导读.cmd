@echo off
cd /d "%~dp0"
if not exist node_modules call npm.cmd install
start "" http://127.0.0.1:5174
call npm.cmd run dev -- --host 127.0.0.1 --port 5174
