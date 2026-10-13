@echo off
title NoteDay
chcp 65001 >nul

cd /d "%~dp0"

set "PORT=8080"
set "URL=http://localhost:%PORT%"

REM Sunucu calisiyor ve yanit veriyor mu kontrol et
python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:%PORT%/index.html', timeout=1)" >nul 2>&1
if %errorlevel%==0 goto open_browser

echo.
echo ==================================================
echo             NoteDay Baslatiliyor...
echo ==================================================
echo.

REM 1. Node.js varsa ve server/server.js mevcutsa calistir
where node >nul 2>&1
if %errorlevel%==0 (
    if exist "server\server.js" (
        start /min "NoteDay-Server" cmd /c "cd /d ""%~dp0server"" && node server.js"
        goto wait_server
    )
)

REM 2. Python (pythonw - arka planda penceresiz) varsa server.py calistir
where pythonw >nul 2>&1
if %errorlevel%==0 (
    start "" pythonw "%~dp0server.py" %PORT%
    goto wait_server
)

REM 3. Normal Python varsa server.py calistir
where python >nul 2>&1
if %errorlevel%==0 (
    start /min "NoteDay-Server" python "%~dp0server.py" %PORT%
    goto wait_server
)

REM Sunucu programi bulunamadiysa dogrudan index.html dosyasina yonlendir
set "URL=%~dp0index.html"
goto open_browser

:wait_server
echo Sunucu hazirlaniyor...
set "TRY_COUNT=0"
:waitloop
ping 127.0.0.1 -n 2 >nul
python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:%PORT%/index.html', timeout=1)" >nul 2>&1
if %errorlevel%==0 goto open_browser
set /a TRY_COUNT+=1
if %TRY_COUNT% LSS 5 goto waitloop

REM 5 saniye icinde port acilmadiysa dosya olarak ac
set "URL=%~dp0index.html"

:open_browser
echo.
echo Chrome ile NoteDay aciliyor...
echo.

REM Google Chrome yolunu tespit et
set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if defined CHROME (
    start "" "%CHROME%" "%URL%"
) else (
    start chrome "%URL%" 2>nul || start "" "%URL%"
)

echo ==================================================
echo  NoteDay basariyla acildi!
echo  Adres: %URL%
echo ==================================================
echo.
ping 127.0.0.1 -n 3 >nul
exit
