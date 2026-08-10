@echo off
REM ============================================================
REM  Actualiza el dossier de Mario Guido con sus partidas nuevas
REM  Doble clic para ejecutarlo cuando quieras.
REM ============================================================
cd /d "%~dp0"
echo Descargando partidas nuevas y actualizando el dossier...
node update-dossier.js
echo.
echo Listo. Abre dossier-mario-guido.html para ver los cambios.
pause
