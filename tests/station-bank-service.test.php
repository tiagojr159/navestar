<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Services/StationBankService.php';

use NaveStar\Services\StationBankService;

function stationBankCheck(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

$deposit = StationBankService::parseRequest(['operation' => 'deposit', 'resource' => 'iron', 'amount' => '25']);
stationBankCheck($deposit['fields']['iron'] === 'iron_kg' && $deposit['amount'] === 25 && !$deposit['bulk'], 'Normalize mineral deposit');

$equipment = StationBankService::parseRequest(['operation' => 'withdraw', 'resource' => 'equipment:tractor_array', 'amount' => 1]);
stationBankCheck($equipment['equipmentResource'] && $equipment['operation'] === 'withdraw', 'Allow equipment withdrawal');

$bulk = StationBankService::parseRequest(['operation' => 'deposit_all']);
stationBankCheck($bulk['bulk'] && $bulk['amount'] === null, 'Preserve bulk deposit without a quantity');

foreach ([
    ['operation' => 'erase', 'resource' => 'iron', 'amount' => 1],
    ['operation' => 'deposit', 'resource' => 'unknown', 'amount' => 1],
    ['operation' => 'deposit', 'resource' => 'iron', 'amount' => 0],
    ['operation' => 'withdraw', 'resource' => 'iron', 'amount' => '1.5'],
    ['operation' => 'deposit', 'resource' => 'equipment:tractor_array', 'amount' => 1],
    ['operation' => 'withdraw', 'resource' => 'fuel', 'amount' => 1000001],
] as $input) {
    $rejected = false;
    try { StationBankService::parseRequest($input); } catch (InvalidArgumentException $error) { $rejected = true; }
    stationBankCheck($rejected, 'Reject invalid station bank input');
}

echo "Station bank service: request validation passed.\n";
