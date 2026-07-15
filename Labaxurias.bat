@echo off
title Labaxurias - Inicializando...
color 0A

echo ============================================
echo   LABAXURIAS - Macumba da Boa
echo ============================================
echo.

:: ============================
:: VERIFICAR PORTA DO BACKEND
:: ============================
set BACKEND_PORT=5291
:check_backend
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo [!] Porta %BACKEND_PORT% ocupada. Tentando %BACKEND_PORT%+1...
    set /a BACKEND_PORT=%BACKEND_PORT%+1
    goto check_backend
)
echo [OK] Backend usara porta: %BACKEND_PORT%

:: ============================
:: VERIFICAR PORTA DO FRONTEND
:: ============================
set FRONTEND_PORT=4200
:check_frontend
netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo [!] Porta %FRONTEND_PORT% ocupada. Tentando %FRONTEND_PORT%+1...
    set /a FRONTEND_PORT=%FRONTEND_PORT%+1
    goto check_frontend
)
echo [OK] Frontend usara porta: %FRONTEND_PORT%

echo.
echo Iniciando macumba em segundo plano...

:: ============================
:: INICIAR BACKEND (MINIMIZADO)
:: ============================
cd /d "%~dp0backend\src\Labaxurias.Api"
start "Labaxurias-Backend" /min cmd /k "dotnet run --urls http://localhost:%BACKEND_PORT%"

:: ============================
:: INICIAR FRONTEND (MINIMIZADO)
:: ============================
cd /d "%~dp0frontend\labaxurias-web"
:: Usando npx para garantir que usa o ng local, e --open=false para não abrir navegador sozinho
start "Labaxurias-Frontend" /min cmd /k "npx ng serve --port %FRONTEND_PORT% --open=false"

:: ============================
:: AGUARDAR SUBIDA DOS SERVIÇOS
:: ============================
echo.
echo Aguardando os spritussss chegarem (15s)...
timeout /t 15 /nobreak >nul

:: ============================
:: ABRIR NAVEGADOR NA GIRA
:: ============================
echo.
echo Abrindo navegador na tela Gira...
start http://localhost:%FRONTEND_PORT%/gira

:: ============================
:: MENSAGEM FINAL E FECHAR
:: ============================
echo.
echo ============================================
echo   Labaxurias iniciado com sucesso!
echo   Backend:  http://localhost:%BACKEND_PORT%
echo   Frontend: http://localhost:%FRONTEND_PORT%
echo ============================================
echo.
echo Para parar: feche as janelas na barra de tarefas.
echo.
timeout /t 5 /nobreak >nul
exit