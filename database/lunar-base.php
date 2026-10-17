<?php
declare(strict_types=1);

/** Ensure the shared lunar surface base exists at the game's current world scale. */
function ensureLunarBase(PDO $pdo): array
{
    $insert = $pdo->prepare(
        "INSERT INTO space_stations (code,name,pos_x,pos_y,pos_z,radius,color,design,services)
         VALUES ('luna-base','Base Lunar',76500,115,-67500,180,'#d8e3ef',23,JSON_ARRAY('trade','weapons','ammunition','repairs'))
         ON DUPLICATE KEY UPDATE name=VALUES(name),pos_x=VALUES(pos_x),pos_y=VALUES(pos_y),pos_z=VALUES(pos_z),radius=VALUES(radius),color=VALUES(color),design=VALUES(design),services=VALUES(services)"
    );
    $insert->execute();
    $query = $pdo->prepare('SELECT id,name,pos_x,pos_y,pos_z FROM space_stations WHERE code=? AND is_active=1 LIMIT 1');
    $query->execute(['luna-base']);
    $station = $query->fetch(PDO::FETCH_ASSOC);
    if (!$station) throw new RuntimeException('A Base Lunar não ficou disponível.');
    $syncDockedShips = $pdo->prepare('UPDATE ships SET pos_x=?,pos_y=?,pos_z=? WHERE docked_station_id=(SELECT id FROM space_stations WHERE code=? LIMIT 1)');
    $syncDockedShips->execute([(float)$station['pos_x'],(float)$station['pos_y'],(float)$station['pos_z'],'luna-base']);
    return $station;
}
