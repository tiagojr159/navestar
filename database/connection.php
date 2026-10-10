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

    $host = 'localhost';
    $database = 'nave';
    $username = 'root';
    $password = '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host={$host};dbname={$database};charset={$charset}";
    $connection = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $connection;
}
