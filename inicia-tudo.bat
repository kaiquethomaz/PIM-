@echo off
echo Iniciando Backend e Frontend...
echo.
echo [1] Abrindo Backend (API) na porta 5000...
start "Backend - API" cmd /k cd /d "%CD%\PIM\src\Inventory.Api" ^& dotnet run --no-build
timeout /t 3

echo [2] Abrindo Frontend na porta 8080...
start "Frontend - Interface" cmd /k cd /d "%CD%\PIM\front" ^& node server.js
timeout /t 2

echo.
echo ✓ Sistemas iniciados!
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8080
echo.
echo Abra seu navegador em: http://localhost:8080
echo.
pause

