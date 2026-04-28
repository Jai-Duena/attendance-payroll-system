@echo off
:loop
C:\xampp\php\php.exe C:\xampp\htdocs\backend\api\attendance\zkteco-sync.php
timeout /t 60 /nobreak
goto loop
