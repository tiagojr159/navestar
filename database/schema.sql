CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(40) NOT NULL UNIQUE,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rank_name VARCHAR(60) NOT NULL DEFAULT 'Piloto Inicial',
    xp INT UNSIGNED NOT NULL DEFAULT 0,
    active_ship_id INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE ship_classes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL,
    asset_path VARCHAR(180) NOT NULL,
    asset_left_path VARCHAR(180) NOT NULL,
    asset_right_path VARCHAR(180) NOT NULL,
    asset_idle_path VARCHAR(180) NOT NULL,
    asset_thrust_path VARCHAR(180) NOT NULL,
    max_energy INT UNSIGNED NOT NULL,
    max_ammo INT UNSIGNED NOT NULL,
    base_speed INT UNSIGNED NOT NULL,
    shield INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weapons (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    weapon_type VARCHAR(40) NOT NULL,
    damage INT UNSIGNED NOT NULL,
    cooldown DECIMAL(5, 2) NOT NULL,
    ammo_cost INT UNSIGNED NOT NULL DEFAULT 1,
    range_units INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ship_class_weapons (
    ship_class_id INT UNSIGNED NOT NULL,
    weapon_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (ship_class_id, weapon_id),
    CONSTRAINT fk_ship_class_weapons_ship FOREIGN KEY (ship_class_id) REFERENCES ship_classes(id),
    CONSTRAINT fk_ship_class_weapons_weapon FOREIGN KEY (weapon_id) REFERENCES weapons(id)
);

CREATE TABLE user_ships (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    ship_class_id INT UNSIGNED NOT NULL,
    nickname VARCHAR(80) NULL,
    current_energy INT UNSIGNED NOT NULL,
    current_ammo INT UNSIGNED NOT NULL,
    pos_x DECIMAL(12, 2) NOT NULL DEFAULT 0,
    pos_y DECIMAL(12, 2) NOT NULL DEFAULT 900,
    pos_z DECIMAL(12, 2) NOT NULL DEFAULT 0,
    rot_x DECIMAL(10, 6) NOT NULL DEFAULT 0,
    rot_y DECIMAL(10, 6) NOT NULL DEFAULT 0,
    rot_z DECIMAL(10, 6) NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_ships_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_ships_class FOREIGN KEY (ship_class_id) REFERENCES ship_classes(id)
);

CREATE TABLE prizes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(90) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_prizes (
    user_id INT UNSIGNED NOT NULL,
    prize_id INT UNSIGNED NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, prize_id),
    CONSTRAINT fk_user_prizes_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_prizes_prize FOREIGN KEY (prize_id) REFERENCES prizes(id)
);

CREATE TABLE friendships (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    requester_user_id INT UNSIGNED NOT NULL,
    addressee_user_id INT UNSIGNED NOT NULL,
    status ENUM('pending', 'accepted', 'blocked') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_friend_pair (requester_user_id, addressee_user_id),
    CONSTRAINT fk_friendships_requester FOREIGN KEY (requester_user_id) REFERENCES users(id),
    CONSTRAINT fk_friendships_addressee FOREIGN KEY (addressee_user_id) REFERENCES users(id)
);

CREATE TABLE movement_actions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_ship_id INT UNSIGNED NOT NULL,
    action_type ENUM('move', 'turn', 'boost', 'brake', 'shoot') NOT NULL,
    pos_x DECIMAL(12, 2) NOT NULL,
    pos_y DECIMAL(12, 2) NOT NULL,
    pos_z DECIMAL(12, 2) NOT NULL,
    rot_x DECIMAL(10, 6) NOT NULL,
    rot_y DECIMAL(10, 6) NOT NULL,
    rot_z DECIMAL(10, 6) NOT NULL,
    vel_x DECIMAL(10, 2) NOT NULL DEFAULT 0,
    vel_y DECIMAL(10, 2) NOT NULL DEFAULT 0,
    vel_z DECIMAL(10, 2) NOT NULL DEFAULT 0,
    client_tick BIGINT UNSIGNED NOT NULL,
    server_tick BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_movement_ship_tick (user_ship_id, server_tick),
    CONSTRAINT fk_movement_actions_ship FOREIGN KEY (user_ship_id) REFERENCES user_ships(id)
);

CREATE TABLE combat_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attacker_ship_id INT UNSIGNED NOT NULL,
    target_ship_id INT UNSIGNED NULL,
    target_kind VARCHAR(40) NOT NULL DEFAULT 'ship',
    weapon_id INT UNSIGNED NOT NULL,
    damage INT UNSIGNED NOT NULL,
    hit_x DECIMAL(12, 2) NOT NULL,
    hit_y DECIMAL(12, 2) NOT NULL,
    hit_z DECIMAL(12, 2) NOT NULL,
    server_tick BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_combat_attacker FOREIGN KEY (attacker_ship_id) REFERENCES user_ships(id),
    CONSTRAINT fk_combat_target FOREIGN KEY (target_ship_id) REFERENCES user_ships(id),
    CONSTRAINT fk_combat_weapon FOREIGN KEY (weapon_id) REFERENCES weapons(id)
);

INSERT INTO ship_classes (id, code, name, asset_path, asset_left_path, asset_right_path, asset_idle_path, asset_thrust_path, max_energy, max_ammo, base_speed, shield) VALUES
(1, 'raptor_classic', 'Raptor Classic', 'images/naves/ship_00_raptor_classic_forward_idle.png', 'images/naves/ship_00_raptor_classic_left_thrust.png', 'images/naves/ship_00_raptor_classic_right_thrust.png', 'images/naves/ship_00_raptor_classic_forward_idle.png', 'images/naves/ship_00_raptor_classic_forward_thrust.png', 120, 80, 1800, 45),
(2, 'manta_ciano', 'Manta Ciano', 'images/naves/ship_01_manta_ciano_forward_idle.png', 'images/naves/ship_01_manta_ciano_left_thrust.png', 'images/naves/ship_01_manta_ciano_right_thrust.png', 'images/naves/ship_01_manta_ciano_forward_idle.png', 'images/naves/ship_01_manta_ciano_forward_thrust.png', 150, 110, 2100, 55),
(3, 'interceptadora_vermelha', 'Interceptadora Vermelha', 'images/naves/ship_02_interceptor_branca_vermelha_forward_idle.png', 'images/naves/ship_02_interceptor_branca_vermelha_left_thrust.png', 'images/naves/ship_02_interceptor_branca_vermelha_right_thrust.png', 'images/naves/ship_02_interceptor_branca_vermelha_forward_idle.png', 'images/naves/ship_02_interceptor_branca_vermelha_forward_thrust.png', 95, 140, 2600, 30),
(4, 'caca_roxa', 'Caca Roxa', 'images/naves/ship_03_caca_roxa_forward_idle.png', 'images/naves/ship_03_caca_roxa_left_thrust.png', 'images/naves/ship_03_caca_roxa_right_thrust.png', 'images/naves/ship_03_caca_roxa_forward_idle.png', 'images/naves/ship_03_caca_roxa_forward_thrust.png', 110, 125, 2350, 38),
(5, 'gunship_pesada', 'Gunship Pesada', 'images/naves/ship_04_gunship_pesada_forward_idle.png', 'images/naves/ship_04_gunship_pesada_left_thrust.png', 'images/naves/ship_04_gunship_pesada_right_thrust.png', 'images/naves/ship_04_gunship_pesada_forward_idle.png', 'images/naves/ship_04_gunship_pesada_forward_thrust.png', 240, 60, 1200, 100),
(6, 'stealth_preta_vermelha', 'Stealth Rubra', 'images/naves/ship_05_stealth_preta_vermelha_forward_idle.png', 'images/naves/ship_05_stealth_preta_vermelha_left_thrust.png', 'images/naves/ship_05_stealth_preta_vermelha_right_thrust.png', 'images/naves/ship_05_stealth_preta_vermelha_forward_idle.png', 'images/naves/ship_05_stealth_preta_vermelha_forward_thrust.png', 100, 160, 2750, 26),
(7, 'transporte_civil', 'Transporte Civil', 'images/naves/nave_06_transporte_civil_reto_motor_desligado.png', 'images/naves/nave_06_transporte_civil_esquerda_motor_ligado.png', 'images/naves/nave_06_transporte_civil_direita_motor_ligado.png', 'images/naves/nave_06_transporte_civil_reto_motor_desligado.png', 'images/naves/nave_06_transporte_civil_reto_motor_ligado.png', 180, 70, 1650, 72),
(8, 'cargueira_industrial', 'Cargueira Industrial', 'images/naves/nave_07_cargueira_industrial_reto_motor_desligado.png', 'images/naves/nave_07_cargueira_industrial_esquerda_motor_ligado.png', 'images/naves/nave_07_cargueira_industrial_direita_motor_ligado.png', 'images/naves/nave_07_cargueira_industrial_reto_motor_desligado.png', 'images/naves/nave_07_cargueira_industrial_reto_motor_ligado.png', 260, 55, 1350, 115),
(9, 'transporte_alienigena', 'Transporte Alienigena', 'images/naves/nave_08_transporte_alienigena_reto_motor_desligado.png', 'images/naves/nave_08_transporte_alienigena_esquerda_motor_ligado.png', 'images/naves/nave_08_transporte_alienigena_direita_motor_ligado.png', 'images/naves/nave_08_transporte_alienigena_reto_motor_desligado.png', 'images/naves/nave_08_transporte_alienigena_reto_motor_ligado.png', 170, 105, 2200, 58),
(10, 'mineracao_salvamento', 'Mineracao e Salvamento', 'images/naves/nave_09_mineracao_salvamento_reto_motor_desligado.png', 'images/naves/nave_09_mineracao_salvamento_esquerda_motor_ligado.png', 'images/naves/nave_09_mineracao_salvamento_direita_motor_ligado.png', 'images/naves/nave_09_mineracao_salvamento_reto_motor_desligado.png', 'images/naves/nave_09_mineracao_salvamento_reto_motor_ligado.png', 210, 90, 1750, 86),
(11, 'destroyer_stealth', 'Destroyer Stealth', 'images/naves/nave_10_destroyer_stealth_reto_motor_desligado.png', 'images/naves/nave_10_destroyer_stealth_esquerda_motor_ligado.png', 'images/naves/nave_10_destroyer_stealth_direita_motor_ligado.png', 'images/naves/nave_10_destroyer_stealth_reto_motor_desligado.png', 'images/naves/nave_10_destroyer_stealth_reto_motor_ligado.png', 145, 180, 2450, 48),
(12, 'css_3d_voyager', 'Voyager CSS 3D', 'model:css_3d_voyager', 'model:css_3d_voyager', 'model:css_3d_voyager', 'model:css_3d_voyager', 'model:css_3d_voyager', 190, 130, 2300, 74),
(13, 'css_3d_cargueira', 'Cargueira Atlas 3D', 'model:css_3d_cargueira', 'model:css_3d_cargueira', 'model:css_3d_cargueira', 'model:css_3d_cargueira', 'model:css_3d_cargueira', 280, 70, 1350, 130),
(14, 'css_3d_transporte', 'Transporte Orion 3D', 'model:css_3d_transporte', 'model:css_3d_transporte', 'model:css_3d_transporte', 'model:css_3d_transporte', 'model:css_3d_transporte', 210, 95, 1900, 88),
(15, 'css_3d_destroyer', 'Destroyer Ares 3D', 'model:css_3d_destroyer', 'model:css_3d_destroyer', 'model:css_3d_destroyer', 'model:css_3d_destroyer', 'model:css_3d_destroyer', 340, 190, 1180, 160),
(16, 'css_3d_interceptor', 'Interceptor Lynx 3D', 'model:css_3d_interceptor', 'model:css_3d_interceptor', 'model:css_3d_interceptor', 'model:css_3d_interceptor', 'model:css_3d_interceptor', 145, 155, 2850, 46),
(17, 'css_3d_alienigena', 'Alienigena Vanta 3D', 'model:css_3d_alienigena', 'model:css_3d_alienigena', 'model:css_3d_alienigena', 'model:css_3d_alienigena', 'model:css_3d_alienigena', 165, 140, 2200, 66);

INSERT INTO weapons (id, name, weapon_type, damage, cooldown, ammo_cost, range_units) VALUES
(1, 'Laser Azul', 'laser', 28, 0.18, 1, 18000),
(2, 'Canhao Plasma', 'plasma', 46, 0.45, 3, 12000),
(3, 'Pulso Ionico', 'ion', 18, 0.12, 1, 9000);

INSERT INTO ship_class_weapons (ship_class_id, weapon_id) VALUES
(1, 1), (1, 2), (2, 1), (3, 2), (3, 3), (4, 1), (4, 3), (5, 1), (5, 2), (6, 2), (6, 3),
(7, 1), (8, 1), (8, 2), (9, 1), (9, 3), (10, 2), (10, 3), (11, 1), (11, 2), (11, 3), (12, 1), (12, 2), (12, 3),
(13, 1), (13, 2), (14, 1), (14, 3), (15, 1), (15, 2), (15, 3), (16, 1), (16, 3), (17, 1), (17, 3);
