<?php
declare(strict_types=1);

namespace NaveStar\Repositories;

use NaveStar\Database\SchemaGuard;
use PDO;

final class ShipPositionRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function load(bool $authenticated, int $userId, string $sessionKey, int $worldScaleVersion): array
    {
        $table = $authenticated ? 'user_ship_positions' : 'guest_ship_positions';
        SchemaGuard::requireTable($this->pdo, $table);
        $query = $this->pdo->prepare($authenticated
            ? 'SELECT position_data FROM user_ship_positions WHERE user_id=? LIMIT 1'
            : 'SELECT position_data FROM guest_ship_positions WHERE session_key=? LIMIT 1');
        $query->execute([$authenticated ? $userId : $sessionKey]);
        $stored = $query->fetchColumn();
        $snapshot = is_string($stored) ? json_decode($stored, true) : null;
        if (!is_array($snapshot)) return [];

        if ((int) ($snapshot['worldScaleVersion'] ?? 1) < $worldScaleVersion) {
            foreach (['x', 'z'] as $axis) {
                if (isset($snapshot[$axis]) && is_numeric($snapshot[$axis])) $snapshot[$axis] = (float) $snapshot[$axis] * 4.5;
            }
            $snapshot['worldScaleVersion'] = $worldScaleVersion;
            $encoded = json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $update = $this->pdo->prepare($authenticated
                ? 'UPDATE user_ship_positions SET position_data=? WHERE user_id=?'
                : 'UPDATE guest_ship_positions SET position_data=? WHERE session_key=?');
            $update->execute([$encoded, $authenticated ? $userId : $sessionKey]);
        }

        return $snapshot;
    }

    public function save(bool $authenticated, int $userId, string $sessionKey, array $snapshot): bool
    {
        $table = $authenticated ? 'user_ship_positions' : 'guest_ship_positions';
        SchemaGuard::requireTable($this->pdo, $table);
        $encoded = json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $save = $this->pdo->prepare($authenticated
            ? 'INSERT INTO user_ship_positions (user_id,position_data) VALUES (?,?) ON DUPLICATE KEY UPDATE position_data=VALUES(position_data)'
            : 'INSERT INTO guest_ship_positions (session_key,position_data) VALUES (?,?) ON DUPLICATE KEY UPDATE position_data=VALUES(position_data)');
        return $save->execute([$authenticated ? $userId : $sessionKey, $encoded]);
    }
}
