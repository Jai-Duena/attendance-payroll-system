@echo off
:: ============================================================================
::  FCH Bio Sync — Build script
::  Run from the bio-sync-app\ directory.
::  Prerequisites:
::    pip install -r requirements.txt
::    Inno Setup 6 (optional, for installer)
:: ============================================================================

setlocal ENABLEDELAYEDEXPANSION
cd /d "%~dp0"

echo.
echo ====================================================
echo  FCH Bio Sync Build
echo ====================================================
echo.

:: ── Step 1: Install/update dependencies ─────────────────────────────────────
echo [1/4] Installing Python dependencies...
pip install -r requirements.txt --quiet
if %ERRORLEVEL% neq 0 (
    echo ERROR: pip install failed.
    pause & exit /b 1
)

:: ── Step 2: Generate icon and copy logo ─────────────────────────────────────
echo [2/4] Converting logo to icon...
python convert_icon.py
if %ERRORLEVEL% neq 0 (
    echo WARNING: Icon conversion failed. Check assets\ folder.
    echo          You can continue but the .exe will use a default icon.
)

:: ── Step 3: PyInstaller ─────────────────────────────────────────────────────
echo [3/4] Building .exe with PyInstaller...
if exist dist\FCHBioSync rmdir /s /q dist\FCHBioSync
python -m PyInstaller build.spec --noconfirm
if %ERRORLEVEL% neq 0 (
    echo ERROR: PyInstaller build failed.
    pause & exit /b 1
)
echo.
echo  .exe ready:  dist\FCHBioSync\FCHBioSync.exe

:: ── Step 4: Inno Setup installer (optional) ─────────────────────────────────
echo [4/4] Building installer...

:: Try common Inno Setup install locations
set ISCC=
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    set ISCC=C:\Program Files (x86)\Inno Setup 6\ISCC.exe
)
if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
    set ISCC=C:\Program Files\Inno Setup 6\ISCC.exe
)
if exist "%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" (
    set ISCC=%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe
)

if "!ISCC!"=="" (
    echo  Inno Setup not found — skipping installer.
    echo  To build the installer later, install Inno Setup 6 from:
    echo    https://jrsoftware.org/isdl.php
    echo  Then run:  "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
) else (
    if not exist installer_output mkdir installer_output
    "!ISCC!" installer.iss /Q
    if !ERRORLEVEL! equ 0 (
        echo  Installer ready:  installer_output\FamilyCareBioSync_Setup_v1.0.exe
    ) else (
        echo  WARNING: Inno Setup build failed.
    )
)

echo.
echo ====================================================
echo  Build complete.
echo ====================================================
echo.
pause
