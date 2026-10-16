<?php
declare(strict_types=1);

/** Create or repair the ten surface bases around the largest moons other than Earth's Moon. */
function ensureMoonBases(PDO $pdo): void
{
    $bases = [
        ['ganymede-base','Base Ganimedes',157878,-148500,'#9ccfc1','#d8e6db'],
        ['titan-base','Base Titã',-148095,-274500,'#d6a05c','#f2d6a6'],
        ['callisto-base','Base Calisto',103842,-171000,'#a59dbc','#d7d4e8'],
        ['io-base','Base Io',184797,-189000,'#d98252','#f2c0a1'],
        ['europa-base','Base Europa',112770,-225000,'#91c9df','#d4edf5'],
        ['triton-base','Base Tritão',-148126.5,-355500,'#93d2c8','#d4eee9'],
        ['titania-base','Base Titania',238797,-297000,'#a9c58e','#d9e8cd'],
        ['rhea-base','Base Reia',-204093,-274500,'#d6a4b4','#f0d8dd'],
        ['oberon-base','Base Oberon',221184,-304650,'#9bc0a7','#d5e4d7'],
        ['iapetus-base','Base Japeto',-224721,-234000,'#c5aa78','#ebe0c8'],
    ];
    $query = $pdo->prepare(
        "INSERT INTO space_stations (code,name,pos_x,pos_y,pos_z,radius,color,design,services)
         VALUES (?,?,?,0,?,180,?,23,JSON_ARRAY('trade','weapons','ammunition','repairs'))
         ON DUPLICATE KEY UPDATE name=VALUES(name),pos_x=VALUES(pos_x),pos_y=VALUES(pos_y),pos_z=VALUES(pos_z),radius=VALUES(radius),color=VALUES(color),design=VALUES(design),services=VALUES(services)"
    );
    foreach ($bases as [$code,$name,$x,$z,$color]) {
        $query->execute([$code,$name,$x,$z,$color]);
    }
}
