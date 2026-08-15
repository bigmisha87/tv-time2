@echo off
title TV Time 2 - Server (keep this window open)
cd /d "%~dp0"
echo.
echo  TV Time 2 is starting...
echo  The app will open in your browser in a few seconds.
echo.
echo  Keep this black window OPEN while using the app.
echo  Closing it stops the app.
echo.
start "" /min cmd /c "timeout /t 6 /nobreak >nul && start "" http://localhost:3000"
npm run dev
