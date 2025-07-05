@echo off
REM Beende alle Prozesse, die Port 5175 belegen (Windows Batch)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5175" ^| find "LISTENING"') do (
    echo Beende Prozess auf Port 5175: PID=%%a
    taskkill /F /PID %%a
)
REM Starte Vite-Dev-Server im Hintergrund
start "" /B cmd /c "cd /d C:\KiKi-NEU\renderer && npm run dev:vite"
REM Warte 8 Sekunden, damit der Dev-Server sicher bereit ist
timeout /t 8
REM Starte Playwright Test-UI im aktuellen Fenster
cd /d C:\KiKi-NEU\Test-App
npx playwright test --ui
REM Hinweis: Die Electron-App wird jetzt nur noch von Playwright für die Tests gestartet!
pause
