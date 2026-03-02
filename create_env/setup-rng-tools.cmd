@echo off
setlocal EnableDelayedExpansion

echo =========================================
echo        RNG Tools Installer
echo =========================================
echo.

:: ------------------------------------------
:: Check WSL existence
:: ------------------------------------------
where wsl >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [!] WSL not found.
    echo Installing WSL...
    wsl --install -d Ubuntu
    echo.
    echo Restart your PC and run this again.
    pause
    exit /b
)

echo [OK] WSL detected.
echo.

:: ------------------------------------------
:: Convert current directory to WSL path
:: ------------------------------------------
set WIN_DIR=%cd%
for /f "tokens=*" %%i in ('wsl wslpath "%WIN_DIR%"') do set WSL_DIR=%%i

echo Running installation inside WSL...
echo ------------------------------------------
echo.

:: ------------------------------------------
:: Execute bash script
:: ------------------------------------------
wsl bash -c "cd '%WSL_DIR%' && chmod +x setup-rng-tools.sh && ./setup-rng-tools.sh"

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Installation script failed.
    pause
    exit /b
)

echo.
echo ------------------------------------------
echo Checking installation report...
echo ------------------------------------------
echo.

:: ------------------------------------------
:: Read JSON report and print result
:: ------------------------------------------
if not exist rng-install-report.json (
    echo [ERROR] Report file not found.
    pause
    exit /b
)

set FAILED=0

for /f "tokens=1,2 delims=:" %%a in (rng-install-report.json) do (
    set line=%%a
    set value=%%b

    echo !value! | find "ok" >nul
    if !errorlevel! == 0 (
        echo [OK] %%a
    ) else (
        echo [FAILED] %%a
        set FAILED=1
    )
)

echo.
echo =========================================

if %FAILED%==0 (
    echo ALL TOOLS INSTALLED SUCCESSFULLY
) else (
    echo SOME TOOLS FAILED - CHECK ABOVE
)

echo =========================================
echo.
pause
