@echo off
setlocal
title Smart Travel Assistant - Baslatici

:: Renkleri ayarla (Mavi arka plan tonu)
color 0B

echo ===================================================
echo    AKILLI GEZI ASISTANI - ERISIM PANELI
echo ===================================================
echo.

:: Dahili IP'yi bulmaya calis (Wireless LAN adapter Wi-Fi altinda)
set "INTERNAL_IP=172.26.75.39"

echo [+] Uygulama baslatiliyor...
echo.
echo ---------------------------------------------------
echo    BAGLANTI LINKEERI:
echo ---------------------------------------------------
echo [YEREL]    : http://localhost:5173
echo [WIFI/AG]  : http://%INTERNAL_IP%:5173
echo.
echo [DIS ERISIM]: npx localtunnel komutu ile bekleniyor...
echo ---------------------------------------------------
echo.
echo (*) Not: Dis erisim linki icin asagida 'url' satirini bekleyin.
echo (*) Not: Google Auth icin bu domainleri Firebase Console'a eklemeyi unutmayin.
echo.

:: Vite sunucusunu baslat (--host ag erisimi icin kritik)
:: Yeni pencerede localtunnel acarak dis erisimi sagla
start "Gezi Asistanı - Yerel Sunucu" cmd /c "npm run dev -- --host"
timeout /t 3 >nul
start "Gezi Asistanı - Dis Erisim (Tunnel)" cmd /c "npx localtunnel --port 5173"

echo.
echo [BAŞARILI] Tüm servisler başlatıldı.
echo Pencereyi kapatmak için bir tuşa basın...
pause >nul
