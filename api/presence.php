<?php

require_once __DIR__ . '/../app/Auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$user = navestar_logged_user();
if (!$user) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'not_authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    if (($payload['online'] ?? true) === false || ($payload['online'] ?? '') === 'false') {
        // Save last position before marking offline when provided.
        if (isset($payload['x']) || isset($payload['y']) || isset($payload['z'])) {
            navestar_touch_presence($user, [
                'x' => $payload['x'] ?? null,
                'y' => $payload['y'] ?? null,
                'z' => $payload['z'] ?? null,
                'rx' => $payload['rx'] ?? null,
                'ry' => $payload['ry'] ?? null,
                'rz' => $payload['rz'] ?? null,
            ]);
        }
        navestar_mark_user_offline((int) $user['id']);
        echo json_encode(['ok' => true]);
        exit;
    }

    navestar_touch_presence($user, [
        'x' => $payload['x'] ?? null,
        'y' => $payload['y'] ?? null,
        'z' => $payload['z'] ?? null,
        'rx' => $payload['rx'] ?? null,
        'ry' => $payload['ry'] ?? null,
        'rz' => $payload['rz'] ?? null,
    ]);

    echo json_encode(['ok' => true]);
    exit;
}

echo json_encode([
    'ok' => true,
    'players' => navestar_online_players((int) $user['id']),
]);
