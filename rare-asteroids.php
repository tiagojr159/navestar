<?php
declare(strict_types=1);

const RARE_ASTEROID_COUNT = 30;
const RARE_ASTEROID_TRAVEL_SECONDS = 12;
const RARE_ASTEROID_STOP_SECONDS = 120;
const ICE_ASTEROID_COUNT = 60;
const ICE_SOURCE_MOONS = ['europa','ganymede','callisto','tita','encelado','iapeto','titania','tritao'];

function rareAsteroidDestination(int $number, int $hop): array
{
    $bytes = hash('sha256', 'nave-rare-' . $number . '-' . $hop, true);
    $parts = unpack('Nx/Nz', substr($bytes, 0, 8));
    return [
        'x' => ((($parts['x'] / 4294967295) * 190000) - 95000) * 4.5,
        'z' => ((($parts['z'] / 4294967295) * 190000) - 95000) * 4.5,
    ];
}

function rareAsteroidMotion(int $number, ?float $now = null): array
{
    $now ??= microtime(true);
    $travel = RARE_ASTEROID_TRAVEL_SECONDS;
    $cycleLength = $travel + RARE_ASTEROID_STOP_SECONDS;
    $localTime = $now + (($number - 1) * $cycleLength / RARE_ASTEROID_COUNT);
    $cycle = (int)floor($localTime / $cycleLength);
    $phase = fmod($localTime, $cycleLength);
    $from = rareAsteroidDestination($number, $cycle);
    $to = rareAsteroidDestination($number, $cycle + 1);
    $moving = $phase < $travel;
    $progress = $moving ? max(0, min(1, $phase / $travel)) : 1;
    $x = $from['x'] + ($to['x'] - $from['x']) * $progress;
    $z = $from['z'] + ($to['z'] - $from['z']) * $progress;
    return [
        'x' => $x, 'z' => $z, 'moving' => $moving,
        'vx' => $moving ? ($to['x'] - $from['x']) / $travel : 0,
        'vz' => $moving ? ($to['z'] - $from['z']) / $travel : 0,
        'phase' => $phase,
        'phaseRemaining' => $moving ? $travel - $phase : $cycleLength - $phase,
    ];
}

function ensureRareAsteroids(PDO $pdo): void
{
    static $seeded = false;
    if ($seeded) return;
    $existing=(int)$pdo->query("SELECT COUNT(*) FROM asteroids WHERE LEFT(code,5)='rare_'")->fetchColumn();
    if ($existing>=RARE_ASTEROID_COUNT) { $seeded=true; return; }
    $insert = $pdo->prepare(
        'INSERT IGNORE INTO asteroids (code,name,pos_x,pos_y,pos_z,radius,color,iron_kg,nickel_kg,cobalt_kg,is_depleted,is_visible)
         VALUES (?,NULL,?,0,?,?,?,18000,6500,1800,0,1)'
    );
    $now = microtime(true);
    for ($i = 1; $i <= RARE_ASTEROID_COUNT; $i++) {
        $position = rareAsteroidMotion($i, $now);
        $insert->execute([
            sprintf('rare_%03d', $i), $position['x'], $position['z'], random_int(78, 105), '#d9a95e'
        ]);
    }
    $seeded = true;
}

function iceAsteroidPosition(int $number): array
{
    $goldenAngle=M_PI*(3-sqrt(5));
    $angle=$number*$goldenAngle+0.37;
    $distance=sqrt(($number-.5)/ICE_ASTEROID_COUNT)*94000;
    return ['x'=>cos($angle)*$distance*4.5,'z'=>sin($angle)*$distance*4.5];
}

function ensureIceAsteroids(PDO $pdo): void
{
    static $seeded=false;
    if ($seeded) return;
    $existing=(int)$pdo->query("SELECT COUNT(*) FROM asteroids WHERE LEFT(code,4)='ice_'")->fetchColumn();
    if ($existing>=ICE_ASTEROID_COUNT) { $seeded=true; return; }
    $insert=$pdo->prepare(
        'INSERT IGNORE INTO asteroids (code,name,pos_x,pos_y,pos_z,radius,color,iron_kg,nickel_kg,cobalt_kg,ice_kg,is_depleted,is_visible)
         VALUES (?,NULL,?,0,?,?,?,0,0,0,14000,0,1)'
    );
    for ($i=1;$i<=ICE_ASTEROID_COUNT;$i++) {
        $position=iceAsteroidPosition($i);
        $insert->execute([sprintf('ice_%03d',$i),$position['x'],$position['z'],random_int(54,82),'#9ddde8']);
    }
    $seeded=true;
}

function ensureMoonIceReserves(PDO $pdo): void
{
    static $seeded=false;
    if ($seeded) return;
    $insert=$pdo->prepare('INSERT IGNORE INTO celestial_resources (body_code,ice_kg) VALUES (?,1000000)');
    foreach (ICE_SOURCE_MOONS as $code) $insert->execute([$code]);
    $seeded=true;
}
