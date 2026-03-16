@echo off
setlocal DisableDelayedExpansion
title GitHub Push Paneli

color 0B

echo ===================================================
echo    GITHUB GUNCELLEME (PUSH) PANELI
echo ===================================================
echo.

:: Klasor kontrolu ve baslatma
if exist ".git" goto skip_init
echo [!] .git klasoru bulunamadi! Git repository baslatiliyor...
git init
git branch -M main
git remote add origin https://github.com/emre5535/GeziAsistan-AI.git
echo [+] Repository basariyla kuruldu.
echo.
:skip_init

echo [+] Degisiklikler hazirlaniyor (git add)...
git add .
echo.

echo [!] Lutfen yaptiginiz degisikligi anlatan kisa bir not yazin:
echo (Ornegin: "Hatalar giderildi" yazip Enter'a basin)
echo.

set "commit_msg="
set /p commit_msg="Notunuz: "
if not defined commit_msg set "commit_msg=Guncelleme"

echo.
echo [+] Degisiklikler kaydediliyor (git commit)...
git commit -m "%commit_msg%"

echo.
echo [+] GitHub'a gonderiliyor (git push)...
echo (Bu islem birkac saniye surebilir...)
echo.

git push -u origin main
if %ERRORLEVEL% EQU 0 goto push_success

echo.
echo [BILGI] Uyusmazlik tespit edildi. Kodlar zorla ustune yaziliyor (Force Push)...
git push -u origin main --force

:push_success
echo.
echo ---------------------------------------------------
echo [TAMAMLANDI] Kodlariniz GitHub'a yuklendi!
echo Vercel uzerinde 1-2 dakika icinde guncellenecektir.
echo ---------------------------------------------------
echo.
echo Kapatmak icin herhangi bir tusa basin.
pause >nul
