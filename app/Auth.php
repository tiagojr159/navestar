<?php

require_once __DIR__ . '/GameData.php';

function navestar_start_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function navestar_data_dir(): string
{
    $path = __DIR__ . '/../storage/data';
    if (!is_dir($path)) {
        mkdir($path, 0777, true);
    }

    return $path;
}

function navestar_users_file(): string
{
    return navestar_data_dir() . '/users.json';
}

function navestar_presence_file(): string
{
    return navestar_data_dir() . '/presence.json';
}

function navestar_read_json(string $file, array $fallback = []): array
{
    if (!is_file($file)) {
        return $fallback;
    }

    $content = file_get_contents($file);
    if ($content === false || $content === '') {
        return $fallback;
    }

    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function navestar_write_json(string $file, array $data): void
{
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function navestar_seed_users(): array
{
    $ships = navestar_ship_classes();
    $users = [
        [
            'id' => 1,
            'username' => 'Comandante',
            'email' => 'comandante@navestar.local',
            'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
            'rank' => 'Piloto Solar',
            'xp' => 1480,
            'active_ship_id' => $ships[0]['id'],
            'created_at' => '2026-05-18',
        ],
        [
            'id' => 2,
            'username' => 'Estelar77',
            'email' => 'estelar77@navestar.local',
            'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
            'rank' => 'Sentinela de Orbita',
            'xp' => 960,
            'active_ship_id' => $ships[2]['id'],
            'created_at' => '2026-05-18',
        ],
        [
            'id' => 3,
            'username' => 'OrionBR',
            'email' => 'orionbr@navestar.local',
            'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
            'rank' => 'Capitao de Carga',
            'xp' => 780,
            'active_ship_id' => $ships[1]['id'],
            'created_at' => '2026-05-18',
        ],
    ];

    navestar_write_json(navestar_users_file(), $users);
    return $users;
}

function navestar_all_users(): array
{
    $users = navestar_read_json(navestar_users_file());
    if ($users !== []) {
        return $users;
    }

    return navestar_seed_users();
}

function navestar_find_user_by_id(int $userId): ?array
{
    foreach (navestar_all_users() as $user) {
        if ((int) $user['id'] === $userId) {
            return $user;
        }
    }

    return null;
}

function navestar_find_user_by_login(string $login): ?array
{
    $login = trim($login);
    foreach (navestar_all_users() as $user) {
        if (strcasecmp($user['username'], $login) === 0 || strcasecmp($user['email'], $login) === 0) {
            return $user;
        }
    }

    return null;
}

function navestar_logged_user(): ?array
{
    navestar_start_session();
    $userId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;
    if ($userId <= 0) {
        return null;
    }

    return navestar_find_user_by_id($userId);
}

function navestar_login(string $login, string $password): bool
{
    navestar_start_session();
    $user = navestar_find_user_by_login($login);
    if (!$user || !password_verify($password, $user['password_hash'])) {
        return false;
    }

    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['username'] = $user['username'];
    // Preserve last known position if it exists.
    $last = navestar_last_position_for_user((int) $user['id']);
    $state = [];
    if (is_array($last)) {
        $state = [
            'x' => $last['position']['x'] ?? null,
            'y' => $last['position']['y'] ?? null,
            'z' => $last['position']['z'] ?? null,
            'rx' => $last['rotation']['x'] ?? null,
            'ry' => $last['rotation']['y'] ?? null,
            'rz' => $last['rotation']['z'] ?? null,
        ];
    }
    navestar_touch_presence($user, $state);
    return true;
}

function navestar_logout(): void
{
    navestar_start_session();
    $user = navestar_logged_user();
    if ($user) {
        navestar_mark_user_offline((int) $user['id']);
    }

    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function navestar_register_user(string $username, string $email, string $password, int $shipId): array
{
    $users = navestar_all_users();
    foreach ($users as $user) {
        if (strcasecmp($user['username'], $username) === 0) {
            return ['ok' => false, 'error' => 'Nome de usuario ja existe.'];
        }
        if (strcasecmp($user['email'], $email) === 0) {
            return ['ok' => false, 'error' => 'E-mail ja cadastrado.'];
        }
    }

    $nextId = 1;
    foreach ($users as $user) {
        $nextId = max($nextId, (int) $user['id'] + 1);
    }

    $record = [
        'id' => $nextId,
        'username' => trim($username),
        'email' => trim($email),
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'rank' => 'Piloto Inicial',
        'xp' => 0,
        'active_ship_id' => $shipId,
        'created_at' => date('Y-m-d'),
    ];
    $users[] = $record;
    navestar_write_json(navestar_users_file(), $users);

    navestar_start_session();
    $_SESSION['user_id'] = $record['id'];
    $_SESSION['username'] = $record['username'];

    return ['ok' => true, 'user' => $record];
}

function navestar_update_active_ship(int $userId, int $shipId): bool
{
    $ships = navestar_ship_classes();
    $shipExists = false;
    foreach ($ships as $ship) {
        if ((int) $ship['id'] === $shipId) {
            $shipExists = true;
            break;
        }
    }
    if (!$shipExists) {
        return false;
    }

    $users = navestar_all_users();
    $updated = false;
    foreach ($users as &$user) {
        if ((int) $user['id'] !== $userId) {
            continue;
        }
        $user['active_ship_id'] = $shipId;
        $updated = true;
        break;
    }
    unset($user);

    if (!$updated) {
        return false;
    }

    navestar_write_json(navestar_users_file(), $users);
    $freshUser = navestar_find_user_by_id($userId);
    if ($freshUser) {
        $last = navestar_last_position_for_user($userId);
        navestar_touch_presence($freshUser, [
            'x' => $last['position']['x'] ?? null,
            'y' => $last['position']['y'] ?? null,
            'z' => $last['position']['z'] ?? null,
            'rx' => $last['rotation']['x'] ?? null,
            'ry' => $last['rotation']['y'] ?? null,
            'rz' => $last['rotation']['z'] ?? null,
        ]);
    }

    return true;
}

function navestar_require_login(): array
{
    $user = navestar_logged_user();
    if ($user) {
        return $user;
    }

    header('Location: login.php');
    exit;
}

function navestar_mark_user_offline(int $userId): void
{
    $presence = navestar_read_json(navestar_presence_file());
    foreach ($presence as &$entry) {
        if ((int) ($entry['user_id'] ?? 0) !== $userId) {
            continue;
        }
        $entry['online'] = false;
        $entry['updated_at'] = time();
    }
    unset($entry);

    navestar_write_json(navestar_presence_file(), $presence);
}

function navestar_touch_presence(array $user, array $state): void
{
    $ships = navestar_ship_classes();
    $activeShip = navestar_active_ship($user, $ships);
    $presence = navestar_read_json(navestar_presence_file());
    $record = [
        'user_id' => (int) $user['id'],
        'username' => $user['username'],
        'ship_name' => $activeShip['name'],
        'ship_asset' => $activeShip['asset'],
        'ship_model' => $activeShip['model'] ?? null,
        'energy' => $activeShip['energy'],
        'ammo' => $activeShip['ammo'],
        'position' => [
            'x' => (float) ($state['x'] ?? 18000),
            'y' => (float) ($state['y'] ?? 900),
            'z' => (float) ($state['z'] ?? -92000),
        ],
        'rotation' => [
            'x' => (float) ($state['rx'] ?? 0),
            'y' => (float) ($state['ry'] ?? 0),
            'z' => (float) ($state['rz'] ?? 0),
        ],
        'online' => true,
        'updated_at' => time(),
    ];

    $replaced = false;
    foreach ($presence as $index => $entry) {
        if ((int) ($entry['user_id'] ?? 0) !== (int) $user['id']) {
            continue;
        }
        $presence[$index] = array_replace_recursive($entry, $record);
        $replaced = true;
        break;
    }

    if (!$replaced) {
        $presence[] = $record;
    }

    navestar_write_json(navestar_presence_file(), $presence);
}

function navestar_last_position_for_user(int $userId): ?array
{
    foreach (navestar_read_json(navestar_presence_file()) as $entry) {
        if ((int) ($entry['user_id'] ?? 0) !== $userId) {
            continue;
        }
        return $entry;
    }

    return null;
}

function navestar_online_players(?int $excludeUserId = null): array
{
    $online = [];
    $now = time();
    foreach (navestar_read_json(navestar_presence_file()) as $entry) {
        $updatedAt = (int) ($entry['updated_at'] ?? 0);
        if (!($entry['online'] ?? false) || ($now - $updatedAt) > 30) {
            continue;
        }
        if ($excludeUserId !== null && (int) ($entry['user_id'] ?? 0) === $excludeUserId) {
            continue;
        }
        $online[] = $entry;
    }

    return $online;
}
