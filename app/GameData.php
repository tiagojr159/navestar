<?php

function navestar_ship_classes(): array
{
    return [
        [
            'id' => 1,
            'code' => 'raptor_classic',
            'name' => 'Raptor Classic',
            'asset' => 'images/naves/ship_00_raptor_classic_forward_idle.png',
            'frames' => [
                'left' => 'images/naves/ship_00_raptor_classic_left_thrust.png',
                'right' => 'images/naves/ship_00_raptor_classic_right_thrust.png',
                'forward_idle' => 'images/naves/ship_00_raptor_classic_forward_idle.png',
                'forward_thrust' => 'images/naves/ship_00_raptor_classic_forward_thrust.png',
            ],
            'energy' => 120,
            'ammo' => 80,
            'speed' => 1800,
            'shield' => 45,
            'weapon_ids' => [1, 2],
        ],
        [
            'id' => 2,
            'code' => 'manta_ciano',
            'name' => 'Manta Ciano',
            'asset' => 'images/naves/ship_01_manta_ciano_forward_idle.png',
            'frames' => [
                'left' => 'images/naves/ship_01_manta_ciano_left_thrust.png',
                'right' => 'images/naves/ship_01_manta_ciano_right_thrust.png',
                'forward_idle' => 'images/naves/ship_01_manta_ciano_forward_idle.png',
                'forward_thrust' => 'images/naves/ship_01_manta_ciano_forward_thrust.png',
            ],
            'energy' => 150,
            'ammo' => 110,
            'speed' => 2100,
            'shield' => 55,
            'weapon_ids' => [1],
        ],
        [
            'id' => 3,
            'code' => 'interceptadora_vermelha',
            'name' => 'Interceptadora Vermelha',
            'asset' => 'images/naves/ship_02_interceptor_branca_vermelha_forward_idle.png',
            'frames' => [
                'left' => 'images/naves/ship_02_interceptor_branca_vermelha_left_thrust.png',
                'right' => 'images/naves/ship_02_interceptor_branca_vermelha_right_thrust.png',
                'forward_idle' => 'images/naves/ship_02_interceptor_branca_vermelha_forward_idle.png',
                'forward_thrust' => 'images/naves/ship_02_interceptor_branca_vermelha_forward_thrust.png',
            ],
            'energy' => 95,
            'ammo' => 140,
            'speed' => 2600,
            'shield' => 30,
            'weapon_ids' => [2, 3],
        ],
        [
            'id' => 4,
            'code' => 'caca_roxa',
            'name' => 'Caca Roxa',
            'asset' => 'images/naves/ship_03_caca_roxa_forward_idle.png',
            'frames' => [
                'left' => 'images/naves/ship_03_caca_roxa_left_thrust.png',
                'right' => 'images/naves/ship_03_caca_roxa_right_thrust.png',
                'forward_idle' => 'images/naves/ship_03_caca_roxa_forward_idle.png',
                'forward_thrust' => 'images/naves/ship_03_caca_roxa_forward_thrust.png',
            ],
            'energy' => 110,
            'ammo' => 125,
            'speed' => 2350,
            'shield' => 38,
            'weapon_ids' => [1, 3],
        ],
        [
            'id' => 5,
            'code' => 'gunship_pesada',
            'name' => 'Gunship Pesada',
            'asset' => 'images/naves/ship_04_gunship_pesada_forward_idle.png',
            'frames' => [
                'left' => 'images/naves/ship_04_gunship_pesada_left_thrust.png',
                'right' => 'images/naves/ship_04_gunship_pesada_right_thrust.png',
                'forward_idle' => 'images/naves/ship_04_gunship_pesada_forward_idle.png',
                'forward_thrust' => 'images/naves/ship_04_gunship_pesada_forward_thrust.png',
            ],
            'energy' => 240,
            'ammo' => 60,
            'speed' => 1200,
            'shield' => 100,
            'weapon_ids' => [1, 2],
        ],
        [
            'id' => 6,
            'code' => 'stealth_preta_vermelha',
            'name' => 'Stealth Rubra',
            'asset' => 'images/naves/ship_05_stealth_preta_vermelha_forward_idle.png',
            'frames' => [
                'left' => 'images/naves/ship_05_stealth_preta_vermelha_left_thrust.png',
                'right' => 'images/naves/ship_05_stealth_preta_vermelha_right_thrust.png',
                'forward_idle' => 'images/naves/ship_05_stealth_preta_vermelha_forward_idle.png',
                'forward_thrust' => 'images/naves/ship_05_stealth_preta_vermelha_forward_thrust.png',
            ],
            'energy' => 100,
            'ammo' => 160,
            'speed' => 2750,
            'shield' => 26,
            'weapon_ids' => [2, 3],
        ],
        [
            'id' => 7,
            'code' => 'transporte_civil',
            'name' => 'Transporte Civil',
            'asset' => 'images/naves/nave_06_transporte_civil_reto_motor_desligado.png',
            'frames' => [
                'left' => 'images/naves/nave_06_transporte_civil_esquerda_motor_ligado.png',
                'right' => 'images/naves/nave_06_transporte_civil_direita_motor_ligado.png',
                'forward_idle' => 'images/naves/nave_06_transporte_civil_reto_motor_desligado.png',
                'forward_thrust' => 'images/naves/nave_06_transporte_civil_reto_motor_ligado.png',
            ],
            'energy' => 180,
            'ammo' => 70,
            'speed' => 1650,
            'shield' => 72,
            'weapon_ids' => [1],
        ],
        [
            'id' => 8,
            'code' => 'cargueira_industrial',
            'name' => 'Cargueira Industrial',
            'asset' => 'images/naves/nave_07_cargueira_industrial_reto_motor_desligado.png',
            'frames' => [
                'left' => 'images/naves/nave_07_cargueira_industrial_esquerda_motor_ligado.png',
                'right' => 'images/naves/nave_07_cargueira_industrial_direita_motor_ligado.png',
                'forward_idle' => 'images/naves/nave_07_cargueira_industrial_reto_motor_desligado.png',
                'forward_thrust' => 'images/naves/nave_07_cargueira_industrial_reto_motor_ligado.png',
            ],
            'energy' => 260,
            'ammo' => 55,
            'speed' => 1350,
            'shield' => 115,
            'weapon_ids' => [1, 2],
        ],
        [
            'id' => 9,
            'code' => 'transporte_alienigena',
            'name' => 'Transporte Alienigena',
            'asset' => 'images/naves/nave_08_transporte_alienigena_reto_motor_desligado.png',
            'frames' => [
                'left' => 'images/naves/nave_08_transporte_alienigena_esquerda_motor_ligado.png',
                'right' => 'images/naves/nave_08_transporte_alienigena_direita_motor_ligado.png',
                'forward_idle' => 'images/naves/nave_08_transporte_alienigena_reto_motor_desligado.png',
                'forward_thrust' => 'images/naves/nave_08_transporte_alienigena_reto_motor_ligado.png',
            ],
            'energy' => 170,
            'ammo' => 105,
            'speed' => 2200,
            'shield' => 58,
            'weapon_ids' => [1, 3],
        ],
        [
            'id' => 10,
            'code' => 'mineracao_salvamento',
            'name' => 'Mineracao e Salvamento',
            'asset' => 'images/naves/nave_09_mineracao_salvamento_reto_motor_desligado.png',
            'frames' => [
                'left' => 'images/naves/nave_09_mineracao_salvamento_esquerda_motor_ligado.png',
                'right' => 'images/naves/nave_09_mineracao_salvamento_direita_motor_ligado.png',
                'forward_idle' => 'images/naves/nave_09_mineracao_salvamento_reto_motor_desligado.png',
                'forward_thrust' => 'images/naves/nave_09_mineracao_salvamento_reto_motor_ligado.png',
            ],
            'energy' => 210,
            'ammo' => 90,
            'speed' => 1750,
            'shield' => 86,
            'weapon_ids' => [2, 3],
        ],
        [
            'id' => 11,
            'code' => 'destroyer_stealth',
            'name' => 'Destroyer Stealth',
            'asset' => 'images/naves/nave_10_destroyer_stealth_reto_motor_desligado.png',
            'frames' => [
                'left' => 'images/naves/nave_10_destroyer_stealth_esquerda_motor_ligado.png',
                'right' => 'images/naves/nave_10_destroyer_stealth_direita_motor_ligado.png',
                'forward_idle' => 'images/naves/nave_10_destroyer_stealth_reto_motor_desligado.png',
                'forward_thrust' => 'images/naves/nave_10_destroyer_stealth_reto_motor_ligado.png',
            ],
            'energy' => 145,
            'ammo' => 180,
            'speed' => 2450,
            'shield' => 48,
            'weapon_ids' => [1, 2, 3],
        ],
        [
            'id' => 12,
            'code' => 'css_3d_voyager',
            'name' => 'Voyager CSS 3D',
            'asset' => 'model:css_3d_voyager',
            'model' => 'css_3d_voyager',
            'frames' => [
                'left' => 'model:css_3d_voyager',
                'right' => 'model:css_3d_voyager',
                'forward_idle' => 'model:css_3d_voyager',
                'forward_thrust' => 'model:css_3d_voyager',
            ],
            'energy' => 190,
            'ammo' => 130,
            'speed' => 2300,
            'shield' => 74,
            'weapon_ids' => [1, 2, 3],
        ],
        [
            'id' => 13,
            'code' => 'css_3d_cargueira',
            'name' => 'Cargueira Atlas 3D',
            'asset' => 'model:css_3d_cargueira',
            'model' => 'css_3d_cargueira',
            'frames' => [
                'left' => 'model:css_3d_cargueira',
                'right' => 'model:css_3d_cargueira',
                'forward_idle' => 'model:css_3d_cargueira',
                'forward_thrust' => 'model:css_3d_cargueira',
            ],
            'energy' => 280,
            'ammo' => 70,
            'speed' => 1350,
            'shield' => 130,
            'weapon_ids' => [1, 2],
        ],
        [
            'id' => 14,
            'code' => 'css_3d_transporte',
            'name' => 'Transporte Orion 3D',
            'asset' => 'model:css_3d_transporte',
            'model' => 'css_3d_transporte',
            'frames' => [
                'left' => 'model:css_3d_transporte',
                'right' => 'model:css_3d_transporte',
                'forward_idle' => 'model:css_3d_transporte',
                'forward_thrust' => 'model:css_3d_transporte',
            ],
            'energy' => 210,
            'ammo' => 95,
            'speed' => 1900,
            'shield' => 88,
            'weapon_ids' => [1, 3],
        ],
        [
            'id' => 15,
            'code' => 'css_3d_destroyer',
            'name' => 'Destroyer Ares 3D',
            'asset' => 'model:css_3d_destroyer',
            'model' => 'css_3d_destroyer',
            'frames' => [
                'left' => 'model:css_3d_destroyer',
                'right' => 'model:css_3d_destroyer',
                'forward_idle' => 'model:css_3d_destroyer',
                'forward_thrust' => 'model:css_3d_destroyer',
            ],
            'energy' => 340,
            'ammo' => 190,
            'speed' => 1180,
            'shield' => 160,
            'weapon_ids' => [1, 2, 3],
        ],
        [
            'id' => 16,
            'code' => 'css_3d_interceptor',
            'name' => 'Interceptor Lynx 3D',
            'asset' => 'model:css_3d_interceptor',
            'model' => 'css_3d_interceptor',
            'frames' => [
                'left' => 'model:css_3d_interceptor',
                'right' => 'model:css_3d_interceptor',
                'forward_idle' => 'model:css_3d_interceptor',
                'forward_thrust' => 'model:css_3d_interceptor',
            ],
            'energy' => 145,
            'ammo' => 155,
            'speed' => 2850,
            'shield' => 46,
            'weapon_ids' => [1, 3],
        ],
        [
            'id' => 17,
            'code' => 'css_3d_alienigena',
            'name' => 'Alienigena Vanta 3D',
            'asset' => 'model:css_3d_alienigena',
            'model' => 'css_3d_alienigena',
            'frames' => [
                'left' => 'model:css_3d_alienigena',
                'right' => 'model:css_3d_alienigena',
                'forward_idle' => 'model:css_3d_alienigena',
                'forward_thrust' => 'model:css_3d_alienigena',
            ],
            'energy' => 165,
            'ammo' => 140,
            'speed' => 2200,
            'shield' => 66,
            'weapon_ids' => [1, 3],
        ],
    ];
}

function navestar_weapons(): array
{
    return [
        ['id' => 1, 'name' => 'Laser Azul', 'type' => 'laser', 'damage' => 28, 'cooldown' => 0.18, 'ammo_cost' => 1, 'range' => 18000],
        ['id' => 2, 'name' => 'Canhao Plasma', 'type' => 'plasma', 'damage' => 46, 'cooldown' => 0.45, 'ammo_cost' => 3, 'range' => 12000],
        ['id' => 3, 'name' => 'Pulso Ionico', 'type' => 'ion', 'damage' => 18, 'cooldown' => 0.12, 'ammo_cost' => 1, 'range' => 9000],
    ];
}

function navestar_current_user(): array
{
    return [
        'id' => 1,
        'username' => 'Comandante',
        'email' => 'comandante@navestar.local',
        'rank' => 'Piloto Solar',
        'xp' => 1480,
        'active_ship_id' => 1,
        'created_at' => '2026-05-18',
    ];
}

function navestar_prizes(): array
{
    return [
        ['name' => 'Primeiro Abate', 'description' => 'Destruiu o primeiro satelite hostil.', 'earned_at' => '2026-05-18'],
        ['name' => 'Rota de Marte', 'description' => 'Visitou a orbita de Marte.', 'earned_at' => '2026-05-18'],
        ['name' => 'Piloto Preciso', 'description' => 'Acertou uma sequencia de lasers sem errar.', 'earned_at' => '2026-05-18'],
    ];
}

function navestar_friends(): array
{
    return [
        ['id' => 2, 'username' => 'Estelar77', 'status' => 'online', 'ship' => 'Interceptadora Vega'],
        ['id' => 3, 'username' => 'LuaNova', 'status' => 'offline', 'ship' => 'Raptor MK-I'],
        ['id' => 4, 'username' => 'OrionBR', 'status' => 'online', 'ship' => 'Cargueira Orion'],
    ];
}

function navestar_active_ship(array $user, array $ships): array
{
    foreach ($ships as $ship) {
        if ($ship['id'] === $user['active_ship_id']) {
            return $ship;
        }
    }

    return $ships[0];
}

function navestar_weapon_names(array $ship, array $weapons): string
{
    $names = [];
    foreach ($weapons as $weapon) {
        if (in_array($weapon['id'], $ship['weapon_ids'], true)) {
            $names[] = $weapon['name'];
        }
    }

    return implode(', ', $names);
}
