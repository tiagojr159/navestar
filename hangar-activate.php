<?php
declare(strict_types=1);
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();
header('Content-Type: application/json; charset=utf-8');

function hangarResponse(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (empty($_SESSION['user_id'])) hangarResponse(401, ['ok' => false, 'error' => 'Entre novamente para selecionar uma nave.']);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') hangarResponse(405, ['ok' => false, 'error' => 'Método não permitido.']);
$csrf = (string) ($_SESSION['csrf_token'] ?? '');
if ($csrf === '' || !hash_equals($csrf, (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''))) {
    hangarResponse(403, ['ok' => false, 'error' => 'A sessão expirou. Atualize a página e tente novamente.']);
}
$input = json_decode((string) file_get_contents('php://input'), true);
$model = is_array($input) ? (string) ($input['model'] ?? '') : '';
$visualIndex = is_array($input) ? filter_var($input['visualModel'] ?? null, FILTER_VALIDATE_INT) : false;
$visualModels = [
    0 => ['class' => 'explorer', 'name' => 'Nave Padrão Alpha'],
    1 => ['class' => 'scout', 'name' => 'Nave Padrão Beta'],
    2 => ['class' => 'prospector', 'name' => 'Pesquisa Orbital'],
    3 => ['class' => 'scout', 'name' => 'Pesquisa Profunda'],
    4 => ['class' => 'attack', 'name' => 'Guerra Interceptora'],
    5 => ['class' => 'attack', 'name' => 'Guerra Pesada'],
    6 => ['class' => 'explorer', 'name' => 'Shuttle de Passageiros'],
    7 => ['class' => 'freighter', 'name' => 'Liner de Passageiros'],
    8 => ['class' => 'freighter', 'name' => 'Cargueiro Industrial'],
    9 => ['class' => 'scout', 'name' => 'Veloz R-01'],
];
$models = [
    'explorer' => ['name' => 'Astra Explorer', 'cargo' => 2000, 'fuel' => 1000, 'hull' => 120],
    'prospector' => ['name' => 'Mantis Prospector', 'cargo' => 3200, 'fuel' => 850, 'hull' => 125],
    'scout' => ['name' => 'Kite Scout', 'cargo' => 1500, 'fuel' => 1500, 'hull' => 100],
    'freighter' => ['name' => 'Atlas Hauler', 'cargo' => 12000, 'fuel' => 1800, 'hull' => 170],
    'attack' => ['name' => 'Viper Interceptor', 'cargo' => 1500, 'fuel' => 1000, 'hull' => 180],
];
if (!isset($models[$model]) || $visualIndex === false || !isset($visualModels[$visualIndex]) || $visualModels[$visualIndex]['class'] !== $model) hangarResponse(422, ['ok' => false, 'error' => 'Modelo de nave inválido.']);

try {
    require_once __DIR__ . '/database/connection.php';
    $pdo = db();
    $userId = (int) $_SESSION['user_id'];
    $username = (string) ($_SESSION['username'] ?? 'PILOTO');
    $spec = $models[$model];
    $visualName = $visualModels[$visualIndex]['name'];
    $shipName = $visualName . ' · ' . $username;
    $pdo->beginTransaction();
    $lock = $pdo->prepare('SELECT id FROM ships WHERE user_id=? AND is_active=1 ORDER BY id LIMIT 1 FOR UPDATE');
    $lock->execute([$userId]);
    $activeId = (int) $lock->fetchColumn();
    if ($activeId) {
        $update = $pdo->prepare('UPDATE ships SET ship_name=?,ship_class=?,cargo_capacity_kg=?,fuel_capacity_units=?,hull_hp=LEAST(hull_hp,?) WHERE id=? AND user_id=?');
        $update->execute([$shipName, $model, $spec['cargo'], $spec['fuel'], $spec['hull'], $activeId, $userId]);
    } else {
        $pdo->prepare('UPDATE ships SET is_active=0 WHERE user_id=?')->execute([$userId]);
        $pdo->prepare('INSERT INTO ships (user_id,ship_name,ship_class,cargo_capacity_kg,fuel_capacity_units,pos_x,pos_z,hull_hp,fuel_units,is_active) VALUES (?,?,?,?,?,0,0,?,?,1)')
            ->execute([$userId, $shipName, $model, $spec['cargo'], $spec['fuel'], $spec['hull'], $spec['fuel']]);
    }
    $pdo->commit();
    hangarResponse(200, ['ok' => true, 'message' => $visualName . ' ativada.']);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Seleção de nave no hangar: ' . $error->getMessage());
    hangarResponse(500, ['ok' => false, 'error' => 'Não foi possível atualizar o hangar. Confira a conexão com o banco de dados.']);
}
