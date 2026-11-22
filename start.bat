@echo off
title mini-ReLiS Launcher
color 0A

echo ============================================
echo         mini-ReLiS - Starting up...
echo ============================================
echo.

:: Step 1: Start PostgreSQL via Docker
echo [1/4] Starting PostgreSQL (Docker)...
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Docker failed to start. Is Docker Desktop running?
    pause
    exit /b 1
)
echo       PostgreSQL started.
echo.

:: Step 2: Wait for Postgres to be ready
echo [2/4] Waiting for PostgreSQL to be ready (5 seconds)...
timeout /t 5 /nobreak >nul

:: Step 3: Run DB migrations
echo [3/4] Running database migrations...
call pnpm --filter api exec prisma migrate deploy
echo       Migrations done.
echo.

:: Step 4: Open API and Web in separate windows
echo [4/4] Starting API and Web servers in new windows...
start "mini-ReLiS API (port 3000)" cmd /k "cd /d "%~dp0" && pnpm dev:api"
timeout /t 2 /nobreak >nul
start "mini-ReLiS Web (port 5173)" cmd /k "cd /d "%~dp0" && pnpm dev:web"

echo.
echo ============================================
echo   All services launched!
echo.
echo   API  -->  http://localhost:3000/health
echo   App  -->  http://localhost:5173
echo.
echo   Close the other two windows to stop.
echo ============================================
echo.
pause
