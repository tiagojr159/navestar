<?php
declare(strict_types=1);

namespace NaveStar\Database;

use PDO;
use RuntimeException;

final class SchemaGuard
{
    private static array $tables = [];
    private static array $columns = [];

    public static function requireTable(PDO $pdo, string $table): void
    {
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) throw new RuntimeException('Nome de tabela inválido.');
        $key = spl_object_id($pdo) . ':' . $table;
        if (isset(self::$tables[$key])) return;
        $query = $pdo->prepare('SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?');
        $query->execute([$table]);
        if (!$query->fetchColumn()) throw new RuntimeException('Esquema do banco incompleto. Execute php bin/migrate.php migrate.');
        self::$tables[$key] = true;
    }

    public static function requireColumn(PDO $pdo, string $table, string $column): void
    {
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $table . $column)) throw new RuntimeException('Nome de coluna inválido.');
        self::requireTable($pdo, $table);
        $key = spl_object_id($pdo) . ':' . $table . ':' . $column;
        if (isset(self::$columns[$key])) return;
        $query = $pdo->prepare('SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?');
        $query->execute([$table, $column]);
        if (!$query->fetchColumn()) throw new RuntimeException('Esquema do banco incompleto. Execute php bin/migrate.php migrate.');
        self::$columns[$key] = true;
    }
}
