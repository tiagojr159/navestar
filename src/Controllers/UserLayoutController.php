<?php
declare(strict_types=1);

namespace NaveStar\Controllers;

require_once __DIR__ . '/../Database/SchemaGuard.php';

use PDO;

final class UserLayoutController
{
    private const CONTROL_TOOLS = ['route','cargo','friends-online','telemetry','ship-status','maneuver'];
    private const STATION_PANELS = ['ships','users','inventory','events'];

    /** @return array{status:int,body:array} */
    public static function handle(PDO $pdo, int $userId, string $action, string $method, array $input): array
    {
        if ($action === 'control-layout') {
            \NaveStar\Database\SchemaGuard::requireTable($pdo, 'user_control_layouts');
            if ($method === 'GET') {
                $query = $pdo->prepare('SELECT tool_order FROM user_control_layouts WHERE user_id=? LIMIT 1');
                $query->execute([$userId]);
                $saved = $query->fetchColumn();
                return self::response(200, ['order' => $saved ? (json_decode((string) $saved, true) ?: null) : null]);
            }
            if ($method !== 'POST') return self::response(405, ['error' => 'Use GET ou POST.']);

            $order = $input['order'] ?? null;
            if (!self::validOrder($order, self::CONTROL_TOOLS)) {
                return self::response(400, ['error' => 'A ordem das ferramentas é inválida.']);
            }
            $order = array_values($order);
            $save = $pdo->prepare('INSERT INTO user_control_layouts (user_id,tool_order) VALUES (?,?) ON DUPLICATE KEY UPDATE tool_order=VALUES(tool_order)');
            $save->execute([$userId, json_encode($order, JSON_UNESCAPED_UNICODE)]);
            return self::response(200, ['ok' => true, 'order' => $order]);
        }

        if ($action === 'station-panel-layout') {
            \NaveStar\Database\SchemaGuard::requireTable($pdo, 'user_station_panel_layouts');
            if ($method === 'GET') {
                $query = $pdo->prepare('SELECT panel_order, collapsed_panels FROM user_station_panel_layouts WHERE user_id=? LIMIT 1');
                $query->execute([$userId]);
                $saved = $query->fetch(PDO::FETCH_ASSOC);
                return self::response(200, [
                    'order' => $saved ? (json_decode((string) $saved['panel_order'], true) ?: null) : null,
                    'collapsed' => $saved ? (json_decode((string) $saved['collapsed_panels'], true) ?: []) : [],
                ]);
            }
            if ($method !== 'POST') return self::response(405, ['error' => 'Use GET ou POST.']);

            $order = $input['order'] ?? null;
            $collapsed = $input['collapsed'] ?? [];
            if (!self::validOrder($order, self::STATION_PANELS) || !self::validCollapsed($collapsed)) {
                return self::response(400, ['error' => 'A organização dos painéis da estação é inválida.']);
            }
            $order = array_values($order);
            $save = $pdo->prepare('INSERT INTO user_station_panel_layouts (user_id,panel_order,collapsed_panels) VALUES (?,?,?) ON DUPLICATE KEY UPDATE panel_order=VALUES(panel_order),collapsed_panels=VALUES(collapsed_panels)');
            $save->execute([$userId, json_encode($order, JSON_UNESCAPED_UNICODE), json_encode($collapsed, JSON_UNESCAPED_UNICODE)]);
            return self::response(200, ['ok' => true, 'order' => $order, 'collapsed' => $collapsed]);
        }

        return self::response(404, ['error' => 'Ação de layout desconhecida.']);
    }

    public static function validOrder($order, array $allowed): bool
    {
        if (!is_array($order) || count($order) !== count($allowed)) return false;
        $strings = array_filter($order, static fn($item): bool => is_string($item));
        if (count($strings) !== count($allowed)) return false;
        foreach ($order as $item) if (!in_array($item, $allowed, true)) return false;
        return count(array_unique($order)) === count($allowed);
    }

    public static function validCollapsed($collapsed): bool
    {
        if (!is_array($collapsed) || count($collapsed) > count(self::STATION_PANELS)) return false;
        $validCount = count(array_filter($collapsed, static fn($value, $key): bool =>
            is_string($key) && in_array($key, self::STATION_PANELS, true) && is_bool($value), ARRAY_FILTER_USE_BOTH));
        return $validCount === count($collapsed);
    }

    private static function response(int $status, array $body): array
    {
        return ['status' => $status, 'body' => $body];
    }
}
