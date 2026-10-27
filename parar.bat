@echo off
setlocal
rem Desliga o AcomPaci (API na porta 8000 e front-end na porta 5173).
title AcomPaci - parar

rem Fecha as janelas abertas pelo inicia.bat (e os processos dentro delas).
taskkill /FI "WINDOWTITLE eq AcomPaci API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq AcomPaci Front*" /T /F >nul 2>&1

rem Garante que nada ficou ouvindo nas portas (ex.: iniciado de outro jeito).
for %%p in (8000 5173) do (
  for /f "tokens=5" %%i in ('netstat -ano ^| findstr /R /C:":%%p .*LISTENING"') do (
    taskkill /PID %%i /T /F >nul 2>&1
  )
)

echo AcomPaci desligado.
timeout /t 3 >nul
