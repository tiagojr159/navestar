<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/database/connection.php';
require_once __DIR__ . '/voice-message-storage.php';

cleanupExpiredVoiceMessages(db(), true);
fwrite(STDOUT, "Limpeza de mensagens de áudio concluída.\n");
