@echo off
title Freelancy - Demarrage MySQL 8.0

:: Verification des privileges administrateur
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Demande d'elevation administrateur...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo ============================================================
echo   Freelancy - Demarrage du service MySQL 8.0 (MySQL80)
echo ============================================================
echo.

net start MySQL80

if %errorlevel% equ 0 (
    echo.
    echo [SUCCES] MySQL 8.0 est demarre avec succes !
    echo.
    echo Configuration du demarrage automatique pour eviter ce probleme...
    sc config MySQL80 start= auto >nul 2>&1
    echo [OK] MySQL80 demarrera desormais automatiquement avec Windows.
) else (
    echo.
    echo Le service est peut-etre deja en cours d'execution ou a rencontre un souci.
)

echo.
echo ============================================================
echo   Vous pouvez maintenant executer : npm run dev:server
echo ============================================================
echo.
pause
