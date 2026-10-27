@echo off
setlocal
rem Inicia o AcomPaci (API + front-end) neste computador.
rem Na primeira vez instala as dependencias e pergunta a senha do root do
rem MySQL desta maquina (fica salva so aqui, em backend\.env).
rem Para trocar a senha depois:  inicia.bat trocar
title AcomPaci - iniciar
cd /d "%~dp0"

set "TROCAR="
if /i "%~1"=="trocar" set "TROCAR=--trocar"

rem ---- Ja esta rodando? -------------------------------------------------
netstat -ano | findstr /R /C:":8000 .*LISTENING" >nul
if not errorlevel 1 (
  echo O AcomPaci ja parece estar rodando ^(porta 8000 ocupada^).
  echo Rode parar.bat antes de iniciar de novo.
  goto :fim_erro
)

rem ---- Python ------------------------------------------------------------
set "PY="
py -3 -c "import sys; sys.exit(sys.version_info < (3, 10))" >nul 2>&1 && set "PY=py -3"
if not defined PY python -c "import sys; sys.exit(sys.version_info < (3, 10))" >nul 2>&1 && set "PY=python"
if not defined PY (
  echo Python 3.10 ou mais novo nao encontrado.
  echo Instale em https://www.python.org/downloads/ marcando "Add python.exe to PATH".
  goto :fim_erro
)

rem ---- Node.js -----------------------------------------------------------
where npm >nul 2>&1
if errorlevel 1 (
  echo Node.js nao encontrado. Instale a versao LTS em https://nodejs.org/
  goto :fim_erro
)

rem ---- Ambiente Python da API (refeito se veio de outro computador) -------
set "VENV_OK="
if exist "backend\.venv\Scripts\python.exe" (
  "backend\.venv\Scripts\python.exe" -c "import fastapi, uvicorn, pymysql, jwt, dotenv" >nul 2>&1 && set "VENV_OK=1"
)
if not defined VENV_OK (
  echo Preparando o ambiente Python da API ^(so na primeira vez^)...
  if exist "backend\.venv" rmdir /s /q "backend\.venv"
  %PY% -m venv "backend\.venv" || goto :fim_erro
  "backend\.venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r "backend\requirements.txt" || goto :fim_erro
)

rem ---- Dependencias do front-end ------------------------------------------
if not exist "node_modules\.bin\vite.cmd" (
  echo Instalando as dependencias do front-end ^(so na primeira vez^)...
  call npm install --no-audit --no-fund || goto :fim_erro
)

rem ---- Configuracao deste computador (.env + senha do MySQL) -------------
pushd backend
".venv\Scripts\python.exe" configurar.py %TROCAR%
set "RC=%errorlevel%"
if "%RC%"=="1" (popd & echo Configuracao cancelada. & goto :fim_erro)
if "%RC%"=="10" (
  echo Criando pacientes e usuarios de demonstracao...
  ".venv\Scripts\python.exe" -m app.seed || (popd & goto :fim_erro)
)
popd

rem ---- Sobe API e front-end em janelas proprias ---------------------------
echo Iniciando a API na porta 8000...
start "AcomPaci API" /min /D "%~dp0backend" cmd /k ".venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"
echo Iniciando o front-end na porta 5173...
start "AcomPaci Front" /min /D "%~dp0." cmd /k "npm run dev"

rem Espera o front-end responder (ate ~30 s) e abre o navegador.
for /l %%i in (1,1,30) do (
  netstat -ano | findstr /R /C:":5173 .*LISTENING" >nul && goto :pronto
  ping -n 2 127.0.0.1 >nul
)
echo O front-end demorou para subir; veja a janela "AcomPaci Front".
goto :fim_erro

:pronto
start "" "http://localhost:5173/recepcionista"
echo.
echo AcomPaci rodando:
echo   Recepcao:      http://localhost:5173/recepcionista
echo   Enfermagem:    http://localhost:5173/enfermeiro
echo   Acompanhante:  http://localhost:5173/acompanhante
echo   API (docs):    http://localhost:8000/docs
echo Para desligar, rode parar.bat.
echo.
timeout /t 8 >nul
exit /b 0

:fim_erro
echo.
pause
exit /b 1
