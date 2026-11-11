<?php
declare(strict_types=1);

/** Combat rules are shared by every fire entry point, including misses. */
function combatWeaponInterval(string $kind): int
{
    return ['pulse'=>180, 'ion'=>320, 'heavy'=>650, 'singularity'=>1100][$kind] ?? 1100;
}

function combatAlignedHit(array $origin, array $target, float $yaw, float $pitch): bool
{
    if (!is_finite($yaw) || !is_finite($pitch) || abs($pitch) > 1.35) return false;
    $dx = (float)$target['pos_x'] - (float)$origin['pos_x'];
    $dy = (float)($target['pos_y'] ?? 0) - (float)($origin['pos_y'] ?? 0);
    $dz = (float)$target['pos_z'] - (float)$origin['pos_z'];
    $distance = sqrt($dx*$dx + $dy*$dy + $dz*$dz);
    $depth = $dx*sin($yaw)*cos($pitch) + $dy*sin($pitch) - $dz*cos($yaw)*cos($pitch);
    $miss = sqrt(max(0, $distance*$distance - $depth*$depth));
    return $distance <= 25000 && $depth > 0 && $miss <= 45 + $depth * .045;
}
