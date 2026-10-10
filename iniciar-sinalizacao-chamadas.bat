@echo off
setlocal
set "PHP_EXE=C:\xampp\php\php.exe"
if not exist "%PHP_EXE%" set "PHP_EXE=php"
start "NAVE - Sinalizacao de chamadas" /min "%PHP_EXE%" "%~dp0call-socket-server.php"
echo Servico de sinalizacao WebSocket iniciado. Mantenha a janela aberta.
endlocal
