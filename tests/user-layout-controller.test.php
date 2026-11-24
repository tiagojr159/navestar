<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Controllers/UserLayoutController.php';

use NaveStar\Controllers\UserLayoutController;

function layoutCheck(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

$control = ['route','cargo','friends-online','telemetry','ship-status','maneuver'];
$panels = ['ships','users','inventory','events'];
layoutCheck(UserLayoutController::validOrder($control, $control), 'Accept a complete control layout');
layoutCheck(!UserLayoutController::validOrder(['route','cargo','friends-online','telemetry','ship-status','other'], $control), 'Reject unknown control tools');
layoutCheck(!UserLayoutController::validOrder(['route','cargo','friends-online','telemetry','ship-status', ['maneuver']], $control), 'Reject nested layout values');
layoutCheck(!UserLayoutController::validOrder(['route','cargo','friends-online','telemetry','ship-status','route'], $control), 'Reject duplicate layout entries');
layoutCheck(UserLayoutController::validCollapsed(['ships' => true, 'events' => false]), 'Accept boolean collapsed state');
layoutCheck(!UserLayoutController::validCollapsed(['ships' => 'true']), 'Reject non-boolean collapsed state');
layoutCheck(!UserLayoutController::validCollapsed(['unknown' => true]), 'Reject unknown station panels');
layoutCheck(UserLayoutController::validOrder($panels, $panels), 'Accept complete station panel layout');

class LayoutTestStatement extends PDOStatement
{
    private LayoutTestPDO $pdo;
    private string $sql;

    public function __construct(LayoutTestPDO $pdo, string $sql) { $this->pdo = $pdo; $this->sql = $sql; }
    public function execute($params = null) { $this->pdo->queries[] = [$this->sql, $params]; return true; }
    public function fetchColumn($column = 0)
    {
        if (strpos($this->sql, 'INFORMATION_SCHEMA.TABLES') !== false) return 1;
        if (strpos($this->sql, 'SELECT tool_order') !== false) return json_encode(['route','cargo','friends-online','telemetry','ship-status','maneuver']);
        return false;
    }
    public function fetch($mode = PDO::FETCH_DEFAULT, $cursorOrientation = PDO::FETCH_ORI_NEXT, $cursorOffset = 0)
    {
        return ['panel_order' => '["ships","users","inventory","events"]', 'collapsed_panels' => '{"ships":true}'];
    }
}

class LayoutTestPDO extends PDO
{
    public array $queries = [];
    public function __construct() {}
    public function prepare($query, $options = []) { return new LayoutTestStatement($this, $query); }
}

$pdo = new LayoutTestPDO();
$controlRead = UserLayoutController::handle($pdo, 8, 'control-layout', 'GET', []);
layoutCheck($controlRead['status'] === 200 && $controlRead['body']['order'] === $control, 'Preserve control layout GET response');
$stationRead = UserLayoutController::handle($pdo, 8, 'station-panel-layout', 'GET', []);
layoutCheck($stationRead['status'] === 200 && $stationRead['body']['collapsed'] === ['ships' => true], 'Preserve station layout GET response');
$controlWrite = UserLayoutController::handle($pdo, 8, 'control-layout', 'POST', ['order' => $control]);
layoutCheck($controlWrite['status'] === 200 && $controlWrite['body']['order'] === $control, 'Preserve control layout POST response');
$stationWrite = UserLayoutController::handle($pdo, 8, 'station-panel-layout', 'POST', ['order' => $panels, 'collapsed' => ['events' => false]]);
layoutCheck($stationWrite['status'] === 200 && $stationWrite['body']['collapsed'] === ['events' => false], 'Preserve station layout POST response');
$invalidWrite = UserLayoutController::handle($pdo, 8, 'station-panel-layout', 'POST', ['order' => $panels, 'collapsed' => ['ships' => 'yes']]);
layoutCheck($invalidWrite['status'] === 400, 'Return bad request for invalid collapsed state');
$methodError = UserLayoutController::handle($pdo, 8, 'control-layout', 'DELETE', []);
layoutCheck($methodError['status'] === 405, 'Reject unsupported layout method');

echo "User layout controller: layout validation passed.\n";
