<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../database/connection.php';
require_once __DIR__ . '/../src/Database/MigrationRunner.php';

$command = $argv[1] ?? 'migrate';
try {
    $runner = new \NaveStar\Database\MigrationRunner(db(), __DIR__ . '/../database/migrations');
    $result = $runner->run($command);
    if ($command === 'status') {
        foreach ($result as $row) fwrite(STDOUT, $row['state'] . "\t" . $row['version'] . PHP_EOL);
    } else {
        fwrite(STDOUT, $result ? implode(PHP_EOL, $result) . PHP_EOL : "Nenhuma migração pendente." . PHP_EOL);
    }
} catch (Throwable $error) {
    fwrite(STDERR, 'Falha na migração: ' . $error->getMessage() . PHP_EOL);
    exit(1);
}
