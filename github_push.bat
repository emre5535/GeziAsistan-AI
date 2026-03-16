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

:: Eger GitHub'da yeni bir proje varsa veya cakistiyorsa, guvenlice birlestirip bas (rebase mantigi veya force gecisi)
:: Ancak varsayilan puste israrli hata verirse force -u komutunu kullanacagiz:
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo [BILGI] GitHub'daki dosyalar ile yereldeki dosyalar arasinda uyusmazlik var.
    echo [BILGI] Verilerinizin ustune yazilmamasi ve mevcut kodun GitHub'a zorla yazilmasi (Force Push) uygulaniyor...
    git push -u origin main --force
)

echo.
echo ---------------------------------------------------
echo [TAMAMLANDI] Kodlariniz GitHub'a yuklendi!
echo Vercel uzerinde 1-2 dakika icinde guncellenecektir.
echo ---------------------------------------------------
echo.
echo Kapatmak icin herhangi bir tusa basin.
pause >nul
