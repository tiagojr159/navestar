<?php
declare(strict_types=1);

// Mantenha este segredo no servidor. Defina NAVE_CALL_SOCKET_SECRET no ambiente
// de produção; o valor abaixo atende instalações locais de desenvolvimento.
return [
    'secret' => (string)(getenv('NAVE_CALL_SOCKET_SECRET') ?: 'a8b1f0de8a9dd9aa560e01d11ddc5fe548bfa8dbeec346365dbb4d5e58493a16'),
    'port' => (int)(getenv('NAVE_CALL_SOCKET_PORT') ?: 8090),
];
