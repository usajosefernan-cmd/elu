@echo off
TITLE Reparador de Docker y WSL (Antigravity)
echo ==========================================
echo   DIAGNOSTICO Y REPARACION DE DOCKER/WSL
echo ==========================================
echo.
echo 1. Habilitando servicio LxssManager...
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command \"Set-Service -Name LxssManager -StartupType Automatic; Start-Service -Name LxssManager\"'"

echo 2. Habilitando servicio WSLService...
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command \"Set-Service -Name WSLService -StartupType Automatic; Start-Service -Name WSLService\"'"

echo 3. Iniciando Docker Desktop Service...
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command \"Set-Service -Name com.docker.service -StartupType Automatic; Start-Service -Name com.docker.service\"'"

echo.
echo 4. Ejecutando Docker Desktop App...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo.
echo ==========================================
echo   PROCESO COMPLETADO
echo   Si la ventana de Docker se abre, todo esta bien.
echo ==========================================
pause
