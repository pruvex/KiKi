@echo off
REM Kill any process on port 5175 (Windows)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5175') do taskkill /f /pid %%a

REM Start Vite Dev Server
start "vite" cmd /c "cd ..\renderer && npm run dev:vite"

REM Wait for Vite to be ready (simple wait, can be improved)
TIMEOUT /T 8

REM Start Playwright tests
npx playwright test
