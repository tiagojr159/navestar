<?php
declare(strict_types=1);

/** Create or repair the surface bases attached to their moons and keep docked ships in place. */
function ensureMoonBases(PDO $pdo): void
{
    // Each base is centered on its moon's X/Z coordinates and placed above its north-pole surface, with the base model aligned to the ground.
    $bases = [
        ['ganymede-base','Base Ganimedes',157500,119,-148500,'#9ccfc1'],
        ['titan-base','Base Titã',-148500,125,-274500,'#d6a05c'],
        ['callisto-base','Base Calisto',103500,111,-171000,'#a59dbc'],
        ['io-base','Base Io',184500,101,-189000,'#d98252'],
        ['europa-base','Base Europa',112500,95,-225000,'#91c9df'],
        ['triton-base','Base Tritão',-148500,118,-355500,'#93d2c8'],
        ['titania-base','Base Titania',238500,101,-297000,'#a9c58e'],
        ['rhea-base','Base Reia',-204300,81,-274500,'#d6a4b4'],
        ['oberon-base','Base Oberon',220950,87,-304650,'#9bc0a7'],
        ['iapetus-base','Base Japeto',-225000,97,-234000,'#c5aa78'],
    ];
    $query = $pdo->prepare(
        "INSERT INTO space_stations (code,name,pos_x,pos_y,pos_z,radius,color,design,services)
         VALUES (?,?,?,?,?,180,?,23,JSON_ARRAY('trade','weapons','ammunition','repairs'))
         ON DUPLICATE KEY UPDATE name=VALUES(name),pos_x=VALUES(pos_x),pos_y=VALUES(pos_y),pos_z=VALUES(pos_z),radius=VALUES(radius),color=VALUES(color),design=VALUES(design),services=VALUES(services)"
    );
    $syncDockedShips = $pdo->prepare('UPDATE ships SET pos_x=?,pos_y=?,pos_z=? WHERE docked_station_id=(SELECT id FROM space_stations WHERE code=? LIMIT 1)');
    foreach ($bases as [$code,$name,$x,$y,$z,$color]) {
        $query->execute([$code,$name,$x,$y,$z,$color]);
        $syncDockedShips->execute([$x,$y,$z,$code]);
    }
}