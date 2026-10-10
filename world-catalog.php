<?php
declare(strict_types=1);

/**
 * Catálogo autoritativo dos corpos estáticos do setor.
 * Para incluir planeta, lua ou estação, acrescente um registro em $bodies.
 * O campo type determina as listas de IDs derivadas abaixo.
 */
$bodies = [
    ['id'=>'terra','name'=>'Terra','type'=>'Planeta','x'=>13000,'y'=>0,'z'=>-12000,'r'=>230,'color'=>'#438be8','texture'=>'earth','moons'=>1],
    ['id'=>'lua','name'=>'Lua','type'=>'Lua','x'=>17000,'y'=>0,'z'=>-15000,'r'=>72,'color'=>'#b9c5d1','texture'=>'moon','parent'=>'terra'],
    ['id'=>'marte','name'=>'Marte','type'=>'Planeta','x'=>-19000,'y'=>0,'z'=>-30000,'r'=>175,'color'=>'#d86e4d','texture'=>'mars','moons'=>2],
    ['id'=>'fobos','name'=>'Fobos','type'=>'Lua','x'=>-14700,'y'=>0,'z'=>-31800,'r'=>38,'color'=>'#a8897c','texture'=>'rock','parent'=>'marte'],
    ['id'=>'deimos','name'=>'Deimos','type'=>'Lua','x'=>-22900,'y'=>0,'z'=>-27400,'r'=>28,'color'=>'#9e8c81','texture'=>'rock','parent'=>'marte'],
    ['id'=>'jupiter','name'=>'Júpiter','type'=>'Planeta','x'=>32000,'y'=>0,'z'=>-43000,'r'=>250,'color'=>'#d4a77d','texture'=>'jupiter','moons'=>4],
    ['id'=>'io','name'=>'Io','type'=>'Lua','x'=>41000,'y'=>0,'z'=>-42000,'r'=>58,'color'=>'#e2c05c','texture'=>'io','parent'=>'jupiter'],
    ['id'=>'europa','name'=>'Europa','type'=>'Lua','x'=>25000,'y'=>0,'z'=>-50000,'r'=>52,'color'=>'#c8b9a3','texture'=>'moon','parent'=>'jupiter','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'ganymede','name'=>'Ganimedes','type'=>'Lua','x'=>35000,'y'=>0,'z'=>-33000,'r'=>76,'color'=>'#a89b8b','texture'=>'moon','parent'=>'jupiter','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'callisto','name'=>'Calisto','type'=>'Lua','x'=>23000,'y'=>0,'z'=>-38000,'r'=>68,'color'=>'#887e75','texture'=>'rock','parent'=>'jupiter','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'saturno','name'=>'Saturno','type'=>'Planeta','x'=>-41000,'y'=>0,'z'=>-59000,'r'=>245,'color'=>'#d8c28c','texture'=>'saturn','rings'=>true,'moons'=>3],
    ['id'=>'tita','name'=>'Titã','type'=>'Lua','x'=>-33000,'y'=>0,'z'=>-61000,'r'=>82,'color'=>'#d69a52','texture'=>'titan','parent'=>'saturno','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'encelado','name'=>'Encélado','type'=>'Lua','x'=>-48000,'y'=>0,'z'=>-65000,'r'=>42,'color'=>'#d5e6e8','texture'=>'moon','parent'=>'saturno','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'iapeto','name'=>'Japeto','type'=>'Lua','x'=>-50000,'y'=>0,'z'=>-52000,'r'=>54,'color'=>'#b0a18c','texture'=>'rock','parent'=>'saturno','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'urano','name'=>'Urano','type'=>'Planeta','x'=>45000,'y'=>0,'z'=>-72000,'r'=>210,'color'=>'#85d3d4','texture'=>'uranus','moons'=>2],
    ['id'=>'titania','name'=>'Titânia','type'=>'Lua','x'=>53000,'y'=>0,'z'=>-66000,'r'=>58,'color'=>'#a9a39b','texture'=>'moon','parent'=>'urano','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'netuno','name'=>'Netuno','type'=>'Planeta','x'=>-26000,'y'=>0,'z'=>-85000,'r'=>205,'color'=>'#3974db','texture'=>'neptune','moons'=>1],
    ['id'=>'tritao','name'=>'Tritão','type'=>'Lua','x'=>-33000,'y'=>0,'z'=>-79000,'r'=>75,'color'=>'#b8c5ce','texture'=>'moon','parent'=>'netuno','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'sol','name'=>'Sol','type'=>'Estrela','x'=>50000,'y'=>0,'z'=>86000,'r'=>400,'color'=>'#ffd878','texture'=>'sun'],
    ['id'=>'aurora','name'=>'Porto Aurora','type'=>'Estação','x'=>-3000,'y'=>0,'z'=>9000,'r'=>220,'color'=>'#7bd5df','texture'=>'station','design'=>0],
    ['id'=>'orbitalis','name'=>'Orbitalis','type'=>'Estação','x'=>92000,'y'=>0,'z'=>74000,'r'=>225,'color'=>'#ffbe77','texture'=>'station','design'=>1],
    ['id'=>'forja','name'=>'Forja do Cintão','type'=>'Estação','x'=>-70000,'y'=>0,'z'=>-60000,'r'=>240,'color'=>'#ff687b','texture'=>'station','design'=>2],
    ['id'=>'celestia','name'=>'Celestia','type'=>'Estação','x'=>-88000,'y'=>0,'z'=>82000,'r'=>230,'color'=>'#ffe0a0','texture'=>'station','design'=>3],
    ['id'=>'khepri','name'=>'Estaleiro Khepri','type'=>'Estação','x'=>-30000,'y'=>0,'z'=>-6000,'r'=>240,'color'=>'#ffa657','texture'=>'station','design'=>4],
    ['id'=>'biosfera','name'=>'Biosfera','type'=>'Estação','x'=>80000,'y'=>0,'z'=>-96000,'r'=>230,'color'=>'#7ee7f0','texture'=>'station','design'=>5],
    ['id'=>'helios','name'=>'Bastilha Hélios','type'=>'Estação','x'=>21000,'y'=>0,'z'=>5000,'r'=>220,'color'=>'#f3b75e','texture'=>'station','design'=>6],
    ['id'=>'polaris','name'=>'Farol Polaris','type'=>'Estação','x'=>69000,'y'=>0,'z'=>-32000,'r'=>200,'color'=>'#c7d8ef','texture'=>'station','design'=>7],
    ['id'=>'icaro','name'=>'Refúgio Ícaro','type'=>'Estação','x'=>-65000,'y'=>0,'z'=>-16000,'r'=>220,'color'=>'#7cebb0','texture'=>'station','design'=>8],
    ['id'=>'vesper','name'=>'Nexo Vésper','type'=>'Estação','x'=>5000,'y'=>0,'z'=>-63000,'r'=>210,'color'=>'#bde9fe','texture'=>'station','design'=>9],
];

// Escala do setor ampliada para criar rotas longas entre estações.
foreach ($bodies as &$body) {
    $body['x'] = (float)$body['x'] * 4.5;
    $body['z'] = (float)$body['z'] * 4.5;
}
unset($body);

$stationIds = array_values(array_map(
    static fn(array $body): string => $body['id'],
    array_filter($bodies, static fn(array $body): bool => $body['type'] === 'Estação')
));
$moonIds = array_values(array_map(
    static fn(array $body): string => $body['id'],
    array_filter($bodies, static fn(array $body): bool => $body['type'] === 'Lua')
));
$missionBodyIds = array_values(array_unique(array_merge($stationIds, $moonIds)));

/** Generate deterministic asteroid positions only for the game view, not autosaves. */
function worldGenerateAsteroids(int $count = 1000): array
{
    $count = max(0, min(1000, $count));
    mt_srand(927401);
    $colors = ['#93877b', '#a49a8d', '#776f68', '#b2a18c', '#817c78'];
    $asteroids = [];
    for ($i = 1; $i <= $count; $i++) {
        $angle = (mt_rand() / mt_getrandmax()) * M_PI * 2;
        $distance = sqrt(mt_rand() / mt_getrandmax()) * 427500;
        $asteroids[] = [
            'id'=>sprintf('asteroide_%03d',$i), 'name'=>sprintf('Asteroide %03d',$i), 'type'=>'Asteroide',
            'x'=>(int)round(cos($angle)*$distance), 'y'=>0, 'z'=>(int)round(sin($angle)*$distance),
            'r'=>mt_rand(18,58), 'color'=>$colors[array_rand($colors)], 'texture'=>'rock',
        ];
    }
    return $asteroids;
}

/** Deterministic ice-bearing asteroids distributed across the 100,000 px sector. */
function worldGenerateIceAsteroids(int $count = 60): array
{
    $asteroids=[];
    $goldenAngle=M_PI*(3-sqrt(5));
    for($i=1;$i<=max(0,$count);$i++){
        $angle=$i*$goldenAngle+0.37;
        $distance=sqrt(($i-.5)/max(1,$count))*423000;
        $asteroids[]=['id'=>sprintf('asteroide_gelo_%03d',$i),'code'=>sprintf('ice_%03d',$i),'name'=>'Asteroide de gelo','type'=>'Asteroide','x'=>cos($angle)*$distance,'y'=>0,'z'=>sin($angle)*$distance,'r'=>54+(($i*17)%29),'color'=>'#9ddde8','texture'=>'ice','ice'=>true,'remainingIce'=>14000];
    }
    return $asteroids;
}

return ['bodies'=>$bodies, 'stationIds'=>$stationIds, 'missionBodyIds'=>$missionBodyIds];
