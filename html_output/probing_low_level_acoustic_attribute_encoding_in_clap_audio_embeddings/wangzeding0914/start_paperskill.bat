@echo off
setlocal
cd /d "%~dp0"
echo.
echo Starting PaperSkill interactive tutorial...
node "scripts\launch-preview.mjs"
if errorlevel 1 (
  echo.
  echo The tutorial could not be started. Keep this window open to read the error.
  pause
)
endlocal
