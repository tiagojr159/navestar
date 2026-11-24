<?php
declare(strict_types=1);

namespace NaveStar\Services;

final class StationRoomService
{
    private const MOON_BASES = ['luna-base','ganymede-base','titan-base','callisto-base','io-base','europa-base','triton-base','titania-base','rhea-base','oberon-base','iapetus-base'];
    private const MOON_ROOMS = ['airlock','command','observatory','geology','workshop','medical','quarters','hydroponics','communications','surface-hangar'];

    public static function isMoonBase(string $stationCode): bool
    {
        return in_array($stationCode, self::MOON_BASES, true);
    }

    public static function roomCode(string $stationCode, float $roomZ): string
    {
        if (self::isMoonBase($stationCode)) {
            $index = max(0, min(9, (int) floor(($roomZ - 24.8) / 19.0)));
            return self::MOON_ROOMS[$index];
        }
        return $roomZ < 109 ? 'observatory' : ($roomZ < 143 ? 'corridor' : 'habitat');
    }

    public static function roomRange(string $stationCode, float $roomZ): array
    {
        if (self::isMoonBase($stationCode)) {
            $index = max(0, min(9, (int) floor(($roomZ - 24.8) / 19.0)));
            return [24.8 + $index * 19.0, $index === 9 ? 221.0 : 24.8 + ($index + 1) * 19.0];
        }
        return $roomZ < 109 ? [0.0,109.0] : ($roomZ < 143 ? [109.0,143.0] : [143.0,221.0]);
    }
}
