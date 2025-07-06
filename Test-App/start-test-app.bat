@echo off
setlocal

REM --- Konfiguration ---
set "PROJECT_ROOT=C:\KiKi-NEU"
set "VITE_PORT=5175"
REM --- OpenAI API Key bitte NICHT fest in die Datei schreiben!
REM Nutze stattdessen eine .env-Datei oder setze die Variable vor dem Start:
REM set "OPENAI_API_KEY=dein-api-key-hier"
REM Der folgende Platzhalter ist KEIN echter Key:
set "OPENAI_API_KEY=sk-<hier-deinen-key-einfügen>"
REM --- 1. Build des Hauptprozesses ---
echo. & echo --- Baue Hauptprozess ---
cd /d "%PROJECT_ROOT%"
call npm run build:main
if %errorlevel% neq 0 (
    echo FEHLER: Build des Hauptprozesses fehlgeschlagen!
    pause
    exit /b %errorlevel%
)

REM --- 2. Prozesse auf VITE_PORT beenden ---
echo. & echo --- Beende Prozesse auf Port %VITE_PORT% ---
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%VITE_PORT%') do (
  if not "%%a"=="0" taskkill /f /pid %%a
)

REM --- 3. Electron Cache löschen ---
echo. & echo --- Lösche Electron Cache ---
rmdir /s /q "%APPDATA%\KiKi" >NUL 2>&1

REM --- 4. Vite Dev Server starten (Playwright übernimmt) ---
echo. & echo --- Playwright startet Vite Dev Server ---

REM --- 5. Warten auf Vite Dev Server (Playwright übernimmt) ---
echo. & echo --- Playwright wartet auf Vite Dev Server ---

REM --- 6. Electron App starten (Playwright übernimmt) ---
echo. & echo --- Playwright startet Electron App ---

REM --- 7. Warten auf Electron App (Playwright übernimmt) ---
echo. & echo --- Playwright wartet auf Electron App ---

REM --- 8. Playwright Tests ausführen ---
echo. & echo --- Starte Playwright Tests ---
cd /d "%PROJECT_ROOT%\Test-App"
npx playwright test --ui --headed
if %errorlevel% neq 0 (
    echo FEHLER: Playwright Tests fehlgeschlagen!
    pause
    exit /b %errorlevel%
)

echo. & echo --- Alle Schritte erfolgreich abgeschlossen! ---
pause
endlocal