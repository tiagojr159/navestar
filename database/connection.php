<?php
declare(strict_types=1);

/**
 * PDO connection for the local XAMPP MySQL database.
 * Include this file where needed, then call db():
 *   require_once __DIR__ . '/database/connection.php';
 *   $pdo = db();
 */
function db(): PDO
{
    static $connection = null;

    if ($connection instanceof PDO) {
        return $connection;
    }

    $projectRoot = dirname(__DIR__);
    $configPath = $projectRoot . '/config.php';
    if (!is_file($configPath)) {
        $configPath = $projectRoot . '/config.example.php';
    }

    $config = require $configPath;
    $databaseConfig = $config['database'] ?? [];

    // Variáveis de ambiente podem sobrescrever a configuração local em produção.
    $host = getenv('DB_HOST') ?: ($databaseConfig['host'] ?? 'localhost');
    $database = getenv('DB_NAME') ?: ($databaseConfig['name'] ?? 'nave');
    $username = getenv('DB_USER') ?: ($databaseConfig['user'] ?? 'root');
    $password = getenv('DB_PASS');
    if ($password === false) {
        $password = $databaseConfig['password'] ?? '';
    }
    $charset = getenv('DB_CHARSET') ?: ($databaseConfig['charset'] ?? 'utf8mb4');

    $dsn = "mysql:host={$host};dbname={$database};charset={$charset}";
    // Bound MySQL handshake/read stalls so a dead local DB cannot pin an Apache worker.
    ini_set('mysqlnd.net_read_timeout', '6');
    $connection = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 4,
    ]);

    return $connection;
}
