@echo off
echo Starting Samvaad Mental Health Platform...
cd /d "%~dp0"
call npm run dev -- --host
pause
