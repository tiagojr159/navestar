<?php
declare(strict_types=1);

return static function (PDO $pdo): void {
    $columnExists = static function (string $table, string $column) use ($pdo): bool {
        $query = $pdo->prepare('SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?');
        $query->execute([$table, $column]);
        return (bool) $query->fetchColumn();
    };
    $indexExists = static function (string $table, string $index) use ($pdo): bool {
        $query = $pdo->prepare('SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?');
        $query->execute([$table, $index]);
        return (bool) $query->fetchColumn();
    };
    $nullable = $pdo->prepare('SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?');
    $nullable->execute(['ship_wrecks', 'destroyed_ship_id']);
    if ($nullable->fetchColumn() === 'NO') {
        $pdo->exec('ALTER TABLE ship_wrecks MODIFY COLUMN destroyed_ship_id BIGINT UNSIGNED NULL');
    }

    if (!$columnExists('ship_wrecks', 'fuel_units')) {
        $pdo->exec('ALTER TABLE ship_wrecks ADD COLUMN fuel_units DECIMAL(8,2) UNSIGNED NOT NULL DEFAULT 0 AFTER energy_units');
    }
    if (!$columnExists('ship_wrecks', 'drop_type')) {
        $pdo->exec("ALTER TABLE ship_wrecks ADD COLUMN drop_type ENUM('wreck','jettison') NOT NULL DEFAULT 'wreck' AFTER energy_units");
    }
    if (!$columnExists('ship_wrecks', 'expires_at')) {
        $pdo->exec('ALTER TABLE ship_wrecks ADD COLUMN expires_at DATETIME NULL DEFAULT NULL AFTER drop_type');
    }
    if (!$columnExists('users', 'ship_kills')) {
        $pdo->exec('ALTER TABLE users ADD COLUMN ship_kills INT UNSIGNED NOT NULL DEFAULT 0');
    }
    if (!$columnExists('ship_wrecks', 'destroyed_by_user_id')) {
        $pdo->exec('ALTER TABLE ship_wrecks ADD COLUMN destroyed_by_user_id BIGINT UNSIGNED NULL');
    }
    if (!$indexExists('ship_wrecks', 'ix_ship_wreck_destroyed_by')) {
        $pdo->exec('ALTER TABLE ship_wrecks ADD KEY ix_ship_wreck_destroyed_by (destroyed_by_user_id)');
    }
};
