# Chamadas de voz entre amigos

O navegador usa WebSocket persistente para convites, atendimento, encerramento e
sinalização da chamada. O áudio ao vivo continua ponto a ponto via WebRTC; o
servidor WebSocket não recebe nem grava o áudio.

## XAMPP local

1. Inicie Apache e MySQL no XAMPP.
2. Execute `iniciar-sinalizacao-chamadas.bat` (ou `php call-socket-server.php`).
3. Abra o jogo em `http://localhost/nave/` e entre com duas contas que sejám amigas.

O serviço escuta a porta 8090. Se o processo não estiver ativo, o jogo mantém a
sinalização pela API e pelo banco de dados como fallback.

## Servidor publicado

Defina `NAVE_CALL_SOCKET_SECRET` com o mesmo segredo aleatório forte no PHP web e
no processo do socket. Defina `NAVE_CALL_SOCKET_PORT` se a porta 8090 não estiver
disponível. Em HTTPS, encaminhe um endpoint `wss://` por proxy reverso para a
porta do serviço; permita também conexões de entrada nessa porta/endpoint.
Execute `call-socket-server.php` como serviço supervisionado para reiniciar em
caso de queda.
