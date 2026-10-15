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
    ['id'=>'mercurio','name'=>'Mercúrio','type'=>'Planeta','x'=>4500,'y'=>0,'z'=>-5500,'r'=>92,'color'=>'#9b9187','texture'=>'mercury','moons'=>0],
    ['id'=>'venus','name'=>'Vênus','type'=>'Planeta','x'=>8500,'y'=>0,'z'=>-8500,'r'=>165,'color'=>'#d5a56f','texture'=>'venus','moons'=>0],
    ['id'=>'marte','name'=>'Marte','type'=>'Planeta','x'=>-19000,'y'=>0,'z'=>-30000,'r'=>175,'color'=>'#d86e4d','texture'=>'mars','moons'=>2],
    ['id'=>'fobos','name'=>'Fobos','type'=>'Lua','x'=>-14700,'y'=>0,'z'=>-31800,'r'=>38,'color'=>'#a8897c','texture'=>'rock','parent'=>'marte'],
    ['id'=>'deimos','name'=>'Deimos','type'=>'Lua','x'=>-22900,'y'=>0,'z'=>-27400,'r'=>28,'color'=>'#9e8c81','texture'=>'rock','parent'=>'marte'],
    ['id'=>'jupiter','name'=>'Júpiter','type'=>'Planeta','x'=>32000,'y'=>0,'z'=>-43000,'r'=>250,'color'=>'#d4a77d','texture'=>'jupiter','moons'=>13],
    ['id'=>'io','name'=>'Io','type'=>'Lua','x'=>41000,'y'=>0,'z'=>-42000,'r'=>58,'color'=>'#e2c05c','texture'=>'io','parent'=>'jupiter'],
    ['id'=>'europa','name'=>'Europa','type'=>'Lua','x'=>25000,'y'=>0,'z'=>-50000,'r'=>52,'color'=>'#c8b9a3','texture'=>'europa','parent'=>'jupiter','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'ganymede','name'=>'Ganimedes','type'=>'Lua','x'=>35000,'y'=>0,'z'=>-33000,'r'=>76,'color'=>'#a89b8b','texture'=>'ganymede','parent'=>'jupiter','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'callisto','name'=>'Calisto','type'=>'Lua','x'=>23000,'y'=>0,'z'=>-38000,'r'=>68,'color'=>'#887e75','texture'=>'callisto','parent'=>'jupiter','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'saturno','name'=>'Saturno','type'=>'Planeta','x'=>-41000,'y'=>0,'z'=>-59000,'r'=>245,'color'=>'#d8c28c','texture'=>'saturn','rings'=>true,'moons'=>16],
    ['id'=>'tita','name'=>'Titã','type'=>'Lua','x'=>-33000,'y'=>0,'z'=>-61000,'r'=>82,'color'=>'#d69a52','texture'=>'titan','parent'=>'saturno','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'encelado','name'=>'Encélado','type'=>'Lua','x'=>-48000,'y'=>0,'z'=>-65000,'r'=>42,'color'=>'#d5e6e8','texture'=>'enceladus','parent'=>'saturno','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'iapeto','name'=>'Japeto','type'=>'Lua','x'=>-50000,'y'=>0,'z'=>-52000,'r'=>54,'color'=>'#b0a18c','texture'=>'iapetus','parent'=>'saturno','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'urano','name'=>'Urano','type'=>'Planeta','x'=>45000,'y'=>0,'z'=>-72000,'r'=>210,'color'=>'#85d3d4','texture'=>'uranus','moons'=>9],
    ['id'=>'titania','name'=>'Titânia','type'=>'Lua','x'=>53000,'y'=>0,'z'=>-66000,'r'=>58,'color'=>'#a9a39b','texture'=>'titania','parent'=>'urano','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'netuno','name'=>'Netuno','type'=>'Planeta','x'=>-26000,'y'=>0,'z'=>-85000,'r'=>205,'color'=>'#3974db','texture'=>'neptune','moons'=>4],
    ['id'=>'tritao','name'=>'Tritão','type'=>'Lua','x'=>-33000,'y'=>0,'z'=>-79000,'r'=>75,'color'=>'#b8c5ce','texture'=>'triton','parent'=>'netuno','iceSource'=>true,'iceKg'=>1000000],
    ['id'=>'plutao','name'=>'Plutão','type'=>'Planeta anão','x'=>82000,'y'=>0,'z'=>-165000,'r'=>105,'color'=>'#b89b87','texture'=>'pluto','moons'=>5],
    ['id'=>'caronte','name'=>'Caronte','type'=>'Lua','x'=>83600,'y'=>0,'z'=>-165300,'r'=>54,'color'=>'#aaa39c','texture'=>'charon','parent'=>'plutao'],
    ['id'=>'nix','name'=>'Nix','type'=>'Lua','x'=>80000,'y'=>0,'z'=>-166700,'r'=>10,'color'=>'#c8c4bd','texture'=>'iceMoon','parent'=>'plutao'],
    ['id'=>'hidra','name'=>'Hidra','type'=>'Lua','x'=>86500,'y'=>0,'z'=>-163900,'r'=>12,'color'=>'#d8d5ce','texture'=>'iceMoon','parent'=>'plutao'],
    ['id'=>'cerbero','name'=>'Cérbero','type'=>'Lua','x'=>79000,'y'=>0,'z'=>-164100,'r'=>7,'color'=>'#877e75','texture'=>'darkMoon','parent'=>'plutao'],
    ['id'=>'estige','name'=>'Estige','type'=>'Lua','x'=>85000,'y'=>0,'z'=>-167300,'r'=>8,'color'=>'#aaa39c','texture'=>'iceMoon','parent'=>'plutao'],
    ['id'=>'eris','name'=>'Éris','type'=>'Planeta anão','x'=>-170000,'y'=>0,'z'=>145000,'r'=>100,'color'=>'#d8d8d3','texture'=>'eris','moons'=>1],
    ['id'=>'disnomia','name'=>'Disnomia','type'=>'Lua','x'=>-171800,'y'=>0,'z'=>146300,'r'=>28,'color'=>'#817d79','texture'=>'darkMoon','parent'=>'eris'],
    ['id'=>'haumea','name'=>'Haumea','type'=>'Planeta anão','x'=>168000,'y'=>0,'z'=>151000,'r'=>83,'color'=>'#e2e7ed','texture'=>'haumea','moons'=>2],
    ['id'=>'hiaka','name'=>'Hiʻiaka','type'=>'Lua','x'=>169900,'y'=>0,'z'=>149400,'r'=>25,'color'=>'#dbedf0','texture'=>'iceMoon','parent'=>'haumea'],
    ['id'=>'namaka','name'=>'Namaka','type'=>'Lua','x'=>166200,'y'=>0,'z'=>152400,'r'=>14,'color'=>'#c6d5d8','texture'=>'iceMoon','parent'=>'haumea'],
    ['id'=>'amalteia','name'=>'Amalteia','type'=>'Lua','x'=>36500,'y'=>0,'z'=>-40700,'r'=>18,'color'=>'#a96d48','texture'=>'amalthea','parent'=>'jupiter'],
    ['id'=>'tebe','name'=>'Tebe','type'=>'Lua','x'=>37900,'y'=>0,'z'=>-44500,'r'=>12,'color'=>'#81766d','texture'=>'rockMoon','parent'=>'jupiter'],
    ['id'=>'himalia','name'=>'Himália','type'=>'Lua','x'=>45200,'y'=>0,'z'=>-48800,'r'=>20,'color'=>'#807970','texture'=>'darkMoon','parent'=>'jupiter'],
    ['id'=>'elara','name'=>'Elara','type'=>'Lua','x'=>26500,'y'=>0,'z'=>-43800,'r'=>16,'color'=>'#91897f','texture'=>'darkMoon','parent'=>'jupiter'],
    ['id'=>'pasife','name'=>'Pasífae','type'=>'Lua','x'=>44300,'y'=>0,'z'=>-36200,'r'=>13,'color'=>'#6f6b67','texture'=>'darkMoon','parent'=>'jupiter'],
    ['id'=>'sinope','name'=>'Sinope','type'=>'Lua','x'=>19700,'y'=>0,'z'=>-41700,'r'=>10,'color'=>'#6e655f','texture'=>'darkMoon','parent'=>'jupiter'],
    ['id'=>'lisiteia','name'=>'Lisiteia','type'=>'Lua','x'=>28300,'y'=>0,'z'=>-34600,'r'=>10,'color'=>'#77716a','texture'=>'darkMoon','parent'=>'jupiter'],
    ['id'=>'carme','name'=>'Carme','type'=>'Lua','x'=>48800,'y'=>0,'z'=>-43000,'r'=>11,'color'=>'#665f5a','texture'=>'darkMoon','parent'=>'jupiter'],
    ['id'=>'ananke','name'=>'Ananke','type'=>'Lua','x'=>16300,'y'=>0,'z'=>-46300,'r'=>9,'color'=>'#716963','texture'=>'darkMoon','parent'=>'jupiter'],
    ['id'=>'mimas','name'=>'Mimas','type'=>'Lua','x'=>-38600,'y'=>0,'z'=>-56600,'r'=>16,'color'=>'#bdbcb6','texture'=>'mimas','parent'=>'saturno'],
    ['id'=>'tetis','name'=>'Tétis','type'=>'Lua','x'=>-43700,'y'=>0,'z'=>-57000,'r'=>28,'color'=>'#cdd5d7','texture'=>'tethys','parent'=>'saturno'],
    ['id'=>'dione','name'=>'Dione','type'=>'Lua','x'=>-38200,'y'=>0,'z'=>-62100,'r'=>30,'color'=>'#c8cdca','texture'=>'dione','parent'=>'saturno'],
    ['id'=>'reia','name'=>'Reia','type'=>'Lua','x'=>-45400,'y'=>0,'z'=>-61000,'r'=>38,'color'=>'#bebfbb','texture'=>'rhea','parent'=>'saturno'],
    ['id'=>'hiperiao','name'=>'Hipérion','type'=>'Lua','x'=>-36100,'y'=>0,'z'=>-58200,'r'=>15,'color'=>'#907864','texture'=>'hyperion','parent'=>'saturno'],
    ['id'=>'febes','name'=>'Febe','type'=>'Lua','x'=>-52300,'y'=>0,'z'=>-61600,'r'=>18,'color'=>'#716a66','texture'=>'darkMoon','parent'=>'saturno'],
    ['id'=>'jano','name'=>'Jano','type'=>'Lua','x'=>-42300,'y'=>0,'z'=>-64100,'r'=>16,'color'=>'#a39d94','texture'=>'rockMoon','parent'=>'saturno'],
    ['id'=>'epimeteu','name'=>'Epimeteu','type'=>'Lua','x'=>-46700,'y'=>0,'z'=>-55800,'r'=>11,'color'=>'#a39d94','texture'=>'rockMoon','parent'=>'saturno'],
    ['id'=>'prometeu','name'=>'Prometeu','type'=>'Lua','x'=>-45200,'y'=>0,'z'=>-57800,'r'=>9,'color'=>'#ab917d','texture'=>'rockMoon','parent'=>'saturno'],
    ['id'=>'pandora','name'=>'Pandora','type'=>'Lua','x'=>-43100,'y'=>0,'z'=>-65800,'r'=>8,'color'=>'#a69788','texture'=>'rockMoon','parent'=>'saturno'],
    ['id'=>'miranda','name'=>'Miranda','type'=>'Lua','x'=>43100,'y'=>0,'z'=>-69700,'r'=>18,'color'=>'#aaa39a','texture'=>'miranda','parent'=>'urano'],
    ['id'=>'ariel','name'=>'Ariel','type'=>'Lua','x'=>48100,'y'=>0,'z'=>-74000,'r'=>43,'color'=>'#c7c4bb','texture'=>'ariel','parent'=>'urano'],
    ['id'=>'umbriel','name'=>'Umbriel','type'=>'Lua','x'=>40700,'y'=>0,'z'=>-75800,'r'=>42,'color'=>'#716e6b','texture'=>'umbriel','parent'=>'urano'],
    ['id'=>'oberon','name'=>'Oberon','type'=>'Lua','x'=>49100,'y'=>0,'z'=>-67700,'r'=>44,'color'=>'#98918b','texture'=>'oberon','parent'=>'urano'],
    ['id'=>'puck','name'=>'Puck','type'=>'Lua','x'=>50400,'y'=>0,'z'=>-70500,'r'=>9,'color'=>'#817970','texture'=>'rockMoon','parent'=>'urano'],
    ['id'=>'portia','name'=>'Portia','type'=>'Lua','x'=>39800,'y'=>0,'z'=>-68800,'r'=>8,'color'=>'#8f8982','texture'=>'rockMoon','parent'=>'urano'],
    ['id'=>'juliet','name'=>'Julieta','type'=>'Lua','x'=>45100,'y'=>0,'z'=>-77800,'r'=>7,'color'=>'#8d847b','texture'=>'rockMoon','parent'=>'urano'],
    ['id'=>'rosalind','name'=>'Rosalinda','type'=>'Lua','x'=>37600,'y'=>0,'z'=>-72700,'r'=>6,'color'=>'#8d847b','texture'=>'rockMoon','parent'=>'urano'],
    ['id'=>'proteu','name'=>'Proteu','type'=>'Lua','x'=>-29800,'y'=>0,'z'=>-81700,'r'=>16,'color'=>'#777570','texture'=>'proteus','parent'=>'netuno'],
    ['id'=>'nereida','name'=>'Nereida','type'=>'Lua','x'=>-21300,'y'=>0,'z'=>-88700,'r'=>13,'color'=>'#a39d95','texture'=>'rockMoon','parent'=>'netuno'],
    ['id'=>'larissa','name'=>'Larissa','type'=>'Lua','x'=>-29100,'y'=>0,'z'=>-87800,'r'=>8,'color'=>'#8a8279','texture'=>'rockMoon','parent'=>'netuno'],
    ['id'=>'sol','name'=>'Sol','type'=>'Estrela','x'=>50000,'y'=>0,'z'=>86000,'r'=>400,'color'=>'#ffd878','texture'=>'sun'],
    ['id'=>'aurora','name'=>'Porto Aurora','type'=>'Estação','x'=>-3000,'y'=>0,'z'=>9000,'r'=>220,'color'=>'#7bd5df','texture'=>'station','design'=>0],
    ['id'=>'orbitalis','name'=>'Orbitalis','type'=>'Estação','x'=>92000,'y'=>0,'z'=>74000,'r'=>225,'color'=>'#ffbe77','texture'=>'station','design'=>1],
    ['id'=>'forjá','name'=>'Forjá do Cintão','type'=>'Estação','x'=>-70000,'y'=>0,'z'=>-60000,'r'=>240,'color'=>'#ff687b','texture'=>'station','design'=>2],
    ['id'=>'celestia','name'=>'Celestia','type'=>'Estação','x'=>-88000,'y'=>0,'z'=>82000,'r'=>230,'color'=>'#ffe0a0','texture'=>'station','design'=>3],
    ['id'=>'khepri','name'=>'Estaleiro Khepri','type'=>'Estação','x'=>-30000,'y'=>0,'z'=>-6000,'r'=>240,'color'=>'#ffa657','texture'=>'station','design'=>4],
    ['id'=>'biosfera','name'=>'Biosfera','type'=>'Estação','x'=>80000,'y'=>0,'z'=>-96000,'r'=>230,'color'=>'#7ee7f0','texture'=>'station','design'=>5],
    ['id'=>'helios','name'=>'Bastilha Hélios','type'=>'Estação','x'=>21000,'y'=>0,'z'=>5000,'r'=>220,'color'=>'#f3b75e','texture'=>'station','design'=>6],
    ['id'=>'polaris','name'=>'Farol Polaris','type'=>'Estação','x'=>69000,'y'=>0,'z'=>-32000,'r'=>200,'color'=>'#c7d8ef','texture'=>'station','design'=>7],
    ['id'=>'icaro','name'=>'Refúgio Ícaro','type'=>'Estação','x'=>-65000,'y'=>0,'z'=>-16000,'r'=>220,'color'=>'#7cebb0','texture'=>'station','design'=>8],
    ['id'=>'vesper','name'=>'Nexo Vésper','type'=>'Estação','x'=>5000,'y'=>0,'z'=>-63000,'r'=>210,'color'=>'#bde9fe','texture'=>'station','design'=>9],
    ['id'=>'vortice','name'=>'Nébula Vórtice','type'=>'Estação','x'=>108000,'y'=>0,'z'=>-28000,'r'=>245,'color'=>'#8d7bff','texture'=>'station','design'=>10],
    ['id'=>'aegis','name'=>'Cidadela Aegis','type'=>'Estação','x'=>-110000,'y'=>0,'z'=>-25000,'r'=>260,'color'=>'#62e6d2','texture'=>'station','design'=>11],
    ['id'=>'járdim-io','name'=>'Jardim de Ío','type'=>'Estação','x'=>34000,'y'=>0,'z'=>112000,'r'=>250,'color'=>'#72f0ad','texture'=>'station','design'=>12],
    ['id'=>'bastilha-rubra','name'=>'Bastilha Rubra','type'=>'Estação','x'=>-4000,'y'=>0,'z'=>-113000,'r'=>270,'color'=>'#ff596e','texture'=>'station','design'=>13],
    ['id'=>'prisma-boreal','name'=>'Prisma Boreal','type'=>'Estação','x'=>108000,'y'=>0,'z'=>75000,'r'=>250,'color'=>'#69d9ff','texture'=>'station','design'=>14],
    ['id'=>'cruz-orion','name'=>'Cruz de Órion','type'=>'Estação','x'=>132000,'y'=>0,'z'=>128000,'r'=>270,'color'=>'#51cfff','texture'=>'station','design'=>15],
    ['id'=>'anel-gaia','name'=>'Anel de Gaia','type'=>'Estação','x'=>-146000,'y'=>0,'z'=>128000,'r'=>285,'color'=>'#64e4c8','texture'=>'station','design'=>16],
    ['id'=>'anel-nereida','name'=>'Anel de Nereida','type'=>'Estação','x'=>140000,'y'=>0,'z'=>-145000,'r'=>275,'color'=>'#8fcaff','texture'=>'station','design'=>17],
    ['id'=>'cupula-helix','name'=>'Cúpula Helix','type'=>'Estação','x'=>-140000,'y'=>0,'z'=>-136000,'r'=>280,'color'=>'#75d9ff','texture'=>'station','design'=>18],
    ['id'=>'gemeas-eos','name'=>'Gêmeas de Eos','type'=>'Estação','x'=>0,'y'=>0,'z'=>156000,'r'=>290,'color'=>'#ffc675','texture'=>'station','design'=>19],
    ['id'=>'bastilha-orion','name'=>'Bastilha de Órion','type'=>'Estação','x'=>-158000,'y'=>0,'z'=>68000,'r'=>285,'color'=>'#52cfff','texture'=>'station','design'=>20],
    ['id'=>'lanca-orion','name'=>'Lança de Órion','type'=>'Estação','x'=>162000,'y'=>0,'z'=>92000,'r'=>290,'color'=>'#68baff','texture'=>'station','design'=>21],
    ['id'=>'coroa-orion','name'=>'Coroa de Órion','type'=>'Estação','x'=>-165000,'y'=>0,'z'=>-97000,'r'=>300,'color'=>'#68e4ec','texture'=>'station','design'=>22],
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
$planetIds = array_values(array_map(
    static fn(array $body): string => $body['id'],
    array_filter($bodies, static fn(array $body): bool => in_array($body['type'], ['Planeta','Planeta anão'], true))
));
$missionBodyIds = array_values(array_unique(array_merge($stationIds, $planetIds, $moonIds)));

/** Generate deterministic asteroid positions only for the game view, not autosaves. */
function worldGenerateAsteroids(int $count = 550): array
{
    $count = max(0, min(600, $count));
    mt_srand(927401);
    $colors = ['#93877b', '#a49a8d', '#776f68', '#b2a18c', '#817c78'];
    $asteroids = [];
    $groupCount = 10;
    $perGroup = min(60, (int)ceil($count / $groupCount));
    $groupCenters = [[-290000,-190000],[-175000,210000],[-90000,-300000],[25000,-255000],[175000,-210000],[295000,-35000],[245000,175000],[70000,300000],[-155000,315000],[-325000,95000]];
    $generated = 0;
    for ($group = 0; $group < $groupCount && $generated < $count; $group++) {
      for ($slot = 0; $slot < $perGroup && $generated < $count; $slot++) {
        $i = ++$generated;
        $angle = ($slot * 2.399963229728653) + $group * 0.71;
        $distance = 3500 + sqrt(($slot + .5) / $perGroup) * 32000;
        $cx = $groupCenters[$group][0]; $cz = $groupCenters[$group][1];
        $asteroids[] = [
            'id'=>sprintf('asteroide_%03d',$i), 'name'=>sprintf('Asteroide %03d',$i), 'group'=>'cinturao_'.sprintf('%02d',$group+1), 'type'=>'Asteroide',
            'x'=>(int)round($cx + cos($angle)*$distance), 'y'=>(int)round(mt_rand(-12,12)*120), 'z'=>(int)round($cz + sin($angle)*$distance),
            'r'=>mt_rand(18,58), 'color'=>$colors[array_rand($colors)], 'texture'=>'rock',
        ];
      }
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
