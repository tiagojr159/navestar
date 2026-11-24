<?php
declare(strict_types=1);

$secret = getenv('NAVE_CALL_SOCKET_SECRET');
$localConfig = [];

if (!is_string($secret) || $secret === '') {
    $localPath = __DIR__ . '/call-socket-config.local.php';
    if (is_file($localPath)) {
        $localConfig = require $localPath;
        $secret = is_array($localConfig) ? ($localConfig['secret'] ?? '') : '';
    }
}

if (!is_string($secret) || strlen($secret) < 32) {
    throw new RuntimeException('NAVE_CALL_SOCKET_SECRET deve conter um segredo seguro.');
}

$portValue = getenv('NAVE_CALL_SOCKET_PORT');
if (!is_string($portValue) || $portValue === '') {
    $portValue = (string) ($localConfig['port'] ?? '8090');
}
$port = filter_var($portValue, FILTER_VALIDATE_INT);

if ($port === false || $port < 1 || $port > 65535) {
    throw new RuntimeException('Porta WebSocket inválida.');
}

return ['secret' => $secret, 'port' => $port];
