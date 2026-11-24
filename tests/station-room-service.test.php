<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Services/StationRoomService.php';

use NaveStar\Services\StationRoomService;

function stationRoomCheck(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

stationRoomCheck(StationRoomService::isMoonBase('luna-base'), 'Recognize lunar station');
stationRoomCheck(!StationRoomService::isMoonBase('porto-aurora'), 'Keep orbital station room rules');
stationRoomCheck(StationRoomService::roomCode('luna-base', 25.0) === 'airlock', 'Resolve first lunar room');
stationRoomCheck(StationRoomService::roomCode('luna-base', 220.0) === 'surface-hangar', 'Clamp to last lunar room');
stationRoomCheck(StationRoomService::roomCode('porto-aurora', 120.0) === 'corridor', 'Resolve orbital corridor');
stationRoomCheck(StationRoomService::roomRange('porto-aurora', 120.0) === [109.0, 143.0], 'Preserve corridor bounds');

echo "Station room service: room mapping and bounds passed.\n";
