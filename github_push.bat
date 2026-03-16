@echo off
setlocal
title GitHub Push Paneli

:: Renk: Acik Mavi
color 0B

echo ===================================================
echo    GITHUB GUNCELLEME (PUSH) PANELI
echo ===================================================
echo.

:: Git klasorunun olup olmadigini kontrol et
if not exist ".git" (
    echo [!] Gizli .git klasoru bulunamadi! Git repository baslatiliyor...
    git init
    git branch -M main
    git remote add origin https://github.com/emre5535/GeziAsistan-AI.git
    echo [+] Repository başarıyla kuruldu.
    echo.
)

echo [+] Degisiklikler hazirlaniyor (git add)...
git add .

echo.
echo [!] Lutfen yaptiginiz degisikligi anlatan kisa bir not yazin:
echo (Ornegin: "Hatalar giderildi" yazip Enter'a basin)
echo.

set /p commit_msg="Notunuz: "
if "%commit_msg%"=="" set commit_msg=Guncelleme

echo.
echo [+] Degisiklikler kaydediliyor (git commit)...
git commit -m "%commit_msg%"

echo.
echo [+] GitHub'a gonderiliyor (git push)...
echo (Bu islem birkac saniye surebilir...)
echo.

git push -u origin main

echo.
echo ---------------------------------------------------
echo [TAMAMLANDI] Kodlariniz GitHub'a yuklendi!
echo Vercel uzerinde 1-2 dakika icinde guncellenecektir.
echo ---------------------------------------------------
echo.
echo Kapatmak icin herhangi bir tusa basin.
pause >nul
