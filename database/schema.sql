-- Esquema inicial do Explorador Espacial (MySQL 8+ / MariaDB 10.5+).
-- Importe este arquivo no phpMyAdmin ou execute com o cliente mysql.
CREATE DATABASE IF NOT EXISTS nave
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nave;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(40) NOT NULL,
  email VARCHAR(190) NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_code VARCHAR(32) NOT NULL DEFAULT 'captain',
  credits BIGINT UNSIGNED NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_seen_at DATETIME NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_presence (is_active, last_seen_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_ship_positions (
  user_id BIGINT UNSIGNED NOT NULL,
  position_data JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_ship_positions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS guest_ship_positions (
  session_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  position_data JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (session_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_control_layouts (
  user_id BIGINT UNSIGNED NOT NULL,
  tool_order JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_control_layout_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  ship_name VARCHAR(80) NOT NULL DEFAULT 'Nave exploradora',
  ship_class VARCHAR(24) NOT NULL DEFAULT 'explorer',
  cargo_capacity_kg INT UNSIGNED NOT NULL DEFAULT 2000,
  fuel_capacity_units SMALLINT UNSIGNED NOT NULL DEFAULT 1000,
  pos_x DOUBLE NOT NULL DEFAULT 0,
  pos_y DOUBLE NOT NULL DEFAULT 0,
  pos_z DOUBLE NOT NULL DEFAULT 0,
  heading DOUBLE NOT NULL DEFAULT 0,
  pitch DOUBLE NOT NULL DEFAULT 0,
  roll DOUBLE NOT NULL DEFAULT 0,
  speed DOUBLE NOT NULL DEFAULT 0,
  iron_kg INT UNSIGNED NOT NULL DEFAULT 0,
  nickel_kg INT UNSIGNED NOT NULL DEFAULT 0,
  cobalt_kg INT UNSIGNED NOT NULL DEFAULT 0,
  ice_kg INT UNSIGNED NOT NULL DEFAULT 0,
  energy_units INT UNSIGNED NOT NULL DEFAULT 0,
  fuel_units DECIMAL(8,2) UNSIGNED NOT NULL DEFAULT 1000.00,
  hull_hp SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  selected_weapon_code VARCHAR(40) NOT NULL DEFAULT 'pulse_cannon',
  docked_station_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_ships_user_active (user_id, is_active), KEY ix_ships_docked_station (docked_station_id),
  CONSTRAINT fk_ships_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ship_wrecks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  destroyed_ship_id BIGINT UNSIGNED NULL,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  pos_x DOUBLE NOT NULL,
  pos_z DOUBLE NOT NULL,
  iron_kg INT UNSIGNED NOT NULL DEFAULT 0,
  nickel_kg INT UNSIGNED NOT NULL DEFAULT 0,
  cobalt_kg INT UNSIGNED NOT NULL DEFAULT 0,
  ice_kg INT UNSIGNED NOT NULL DEFAULT 0,
  energy_units INT UNSIGNED NOT NULL DEFAULT 0,
  drop_type ENUM('wreck','jettison') NOT NULL DEFAULT 'wreck',
  expires_at DATETIME NULL DEFAULT NULL,
  claimed_by BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_ship_wreck_position (pos_x,pos_z,created_at),
  KEY ix_ship_wreck_owner (owner_user_id,created_at),
  CONSTRAINT fk_ship_wreck_ship FOREIGN KEY (destroyed_ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_wreck_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_wreck_claimed_by FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS equipment (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(100) NOT NULL,
  equipment_type ENUM('weapon','ammunition','upgrade','defense','engine','mining_tool') NOT NULL,
  description TEXT NULL,
  damage SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ammo_capacity SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  quantity_per_purchase SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  price_credits INT UNSIGNED NOT NULL DEFAULT 0,
  iron_cost_kg INT UNSIGNED NOT NULL DEFAULT 0,
  nickel_cost_kg INT UNSIGNED NOT NULL DEFAULT 0,
  cobalt_cost_kg INT UNSIGNED NOT NULL DEFAULT 0,
  weight_kg SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_equipment_code (code),
  KEY ix_equipment_type_available (equipment_type, is_available)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ship_equipment (
  ship_id BIGINT UNSIGNED NOT NULL,
  equipment_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  ammo_current INT UNSIGNED NOT NULL DEFAULT 0,
  upgrade_level SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_equipped TINYINT(1) NOT NULL DEFAULT 0,
  acquired_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ship_id, equipment_id),
  KEY ix_ship_equipment_equipped (ship_id, is_equipped),
  CONSTRAINT fk_ship_equipment_ship FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_equipment_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS friend_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_friend_request_pair (requester_id, recipient_id),
  KEY ix_friend_requests_recipient (recipient_id, status),
  KEY ix_friend_requests_requester (requester_id, status),
  CONSTRAINT fk_friend_request_sender FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_friend_request_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_friend_request_not_self CHECK (requester_id <> recipient_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS voice_calls (
  call_id CHAR(36) NOT NULL,
  caller_id BIGINT UNSIGNED NOT NULL,
  callee_id BIGINT UNSIGNED NOT NULL,
  status ENUM('ringing','accepted','declined','ended','missed') NOT NULL DEFAULT 'ringing',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (call_id),
  KEY ix_voice_calls_caller_status (caller_id, status, updated_at),
  KEY ix_voice_calls_callee_status (callee_id, status, updated_at),
  CONSTRAINT fk_voice_call_caller FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_voice_call_callee FOREIGN KEY (callee_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_voice_call_not_self CHECK (caller_id <> callee_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS call_signals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  call_id CHAR(36) NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  signal_type ENUM('offer','answer','ice') NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY ix_call_signals_recipient (call_id, recipient_id, read_at, id),
  CONSTRAINT fk_call_signal_call FOREIGN KEY (call_id) REFERENCES voice_calls(call_id) ON DELETE CASCADE,
  CONSTRAINT fk_call_signal_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_call_signal_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS crew_voice_signals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ship_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  signal_type ENUM('offer','answer','ice','close') NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY ix_crew_voice_recipient (ship_id, recipient_id, read_at, id),
  KEY ix_crew_voice_expiry (created_at),
  CONSTRAINT fk_crew_voice_ship FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_crew_voice_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_crew_voice_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS voice_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  channel_type ENUM('private','open','station') NOT NULL DEFAULT 'private',
  mime_type VARCHAR(80) NOT NULL,
  duration_ms SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  storage_path VARCHAR(255) NOT NULL,
  status ENUM('pending','listened','dismissed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_voice_messages_recipient (recipient_id,status,created_at),
  CONSTRAINT fk_voice_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_voice_message_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_voice_message_not_self CHECK (sender_id <> recipient_id)
) ENGINE=InnoDB;


-- A tabela inclui o Sol usando body_type='star' para manter um catálogo espacial único.
CREATE TABLE IF NOT EXISTS planets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(100) NOT NULL,
  body_type ENUM('planet','star') NOT NULL DEFAULT 'planet',
  pos_x DOUBLE NOT NULL,
  pos_y DOUBLE NOT NULL DEFAULT 0,
  pos_z DOUBLE NOT NULL,
  radius SMALLINT UNSIGNED NOT NULL,
  color CHAR(7) NOT NULL,
  texture_key VARCHAR(40) NOT NULL,
  has_rings TINYINT(1) NOT NULL DEFAULT 0,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_planets_code (code),
  KEY ix_planets_visible (is_visible, body_type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS moons (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  planet_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(100) NOT NULL,
  pos_x DOUBLE NOT NULL,
  pos_y DOUBLE NOT NULL DEFAULT 0,
  pos_z DOUBLE NOT NULL,
  radius SMALLINT UNSIGNED NOT NULL,
  color CHAR(7) NOT NULL,
  texture_key VARCHAR(40) NOT NULL,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_moons_code (code),
  KEY ix_moons_planet (planet_id),
  CONSTRAINT fk_moons_planet FOREIGN KEY (planet_id) REFERENCES planets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS celestial_resources (
  body_code VARCHAR(40) NOT NULL,
  ice_kg BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (body_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS asteroids (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(100) NULL,
  pos_x DOUBLE NOT NULL,
  pos_y DOUBLE NOT NULL DEFAULT 0,
  pos_z DOUBLE NOT NULL,
  radius TINYINT UNSIGNED NOT NULL,
  color CHAR(7) NOT NULL,
  iron_kg INT UNSIGNED NOT NULL DEFAULT 0,
  nickel_kg INT UNSIGNED NOT NULL DEFAULT 0,
  cobalt_kg INT UNSIGNED NOT NULL DEFAULT 0,
  ice_kg INT UNSIGNED NOT NULL DEFAULT 0,
  is_depleted TINYINT(1) NOT NULL DEFAULT 0,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  discovered_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asteroids_code (code),
  KEY ix_asteroids_region (is_visible, pos_x, pos_z),
  KEY ix_asteroids_depleted (is_depleted)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS space_stations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(100) NOT NULL,
  pos_x DOUBLE NOT NULL,
  pos_y DOUBLE NOT NULL DEFAULT 0,
  pos_z DOUBLE NOT NULL,
  radius SMALLINT UNSIGNED NOT NULL,
  color CHAR(7) NOT NULL,
  design SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  services JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  hull_hp INT UNSIGNED NOT NULL DEFAULT 1000,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_space_stations_code (code),
  KEY ix_space_stations_active (is_active, pos_x, pos_z)
 ) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS station_occupants (
  user_id BIGINT UNSIGNED NOT NULL,
  station_id BIGINT UNSIGNED NOT NULL,
  mode ENUM('station','aboard') NOT NULL DEFAULT 'station',
  ship_id BIGINT UNSIGNED NULL,
  room_pos_x DECIMAL(6,2) NOT NULL DEFAULT 50.00,
  room_pos_z DECIMAL(6,2) NOT NULL DEFAULT 75.00,
  room_yaw DECIMAL(7,4) NOT NULL DEFAULT 0.0000,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id), KEY ix_station_occupants_station (station_id,mode),
  CONSTRAINT fk_station_occupant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_station_occupant_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE,
  CONSTRAINT fk_station_occupant_ship FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS station_voice_signals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  station_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NOT NULL,
  signal_type ENUM('offer','answer','ice','close') NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY ix_station_voice_recipient (station_id, recipient_id, read_at, id),
  KEY ix_station_voice_expiry (created_at),
  CONSTRAINT fk_station_voice_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE,
  CONSTRAINT fk_station_voice_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_station_voice_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS station_trades (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  station_id BIGINT UNSIGNED NOT NULL,
  player_a_id BIGINT UNSIGNED NOT NULL,
  player_b_id BIGINT UNSIGNED NOT NULL,
  offer_a JSON NOT NULL,
  offer_b JSON NOT NULL,
  locked_a TINYINT(1) NOT NULL DEFAULT 0,
  locked_b TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('open','completed','cancelled') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_station_trades_players (player_a_id,status,updated_at),
  KEY ix_station_trades_partner (player_b_id,status,updated_at),
  CONSTRAINT fk_station_trade_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE,
  CONSTRAINT fk_station_trade_a FOREIGN KEY (player_a_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_station_trade_b FOREIGN KEY (player_b_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_station_trade_distinct CHECK (player_a_id <> player_b_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ship_crew (
  ship_id BIGINT UNSIGNED NOT NULL,
  captain_id BIGINT UNSIGNED NOT NULL,
  copilot_id BIGINT UNSIGNED NOT NULL,
  station_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','active') NOT NULL DEFAULT 'pending',
  request_by ENUM('captain','copilot') NOT NULL DEFAULT 'captain',
  invited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ship_id), UNIQUE KEY uq_ship_crew_copilot (copilot_id), KEY ix_ship_crew_captain (captain_id,status),
  CONSTRAINT fk_ship_crew_ship FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_crew_captain FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_crew_copilot FOREIGN KEY (copilot_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_crew_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE,
  CONSTRAINT chk_ship_crew_distinct CHECK (captain_id <> copilot_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ship_passengers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ship_id BIGINT UNSIGNED NOT NULL,
  passenger_id BIGINT UNSIGNED NOT NULL,
  origin_station_id BIGINT UNSIGNED NOT NULL,
  destination_station_id BIGINT UNSIGNED NOT NULL,
  fare_credits INT UNSIGNED NOT NULL,
  status ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  boarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  arrived_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY ix_ship_passengers_ship (ship_id,status),
  KEY ix_ship_passengers_player (passenger_id,status),
  CONSTRAINT fk_ship_passenger_ship FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_passenger_user FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_passenger_origin FOREIGN KEY (origin_station_id) REFERENCES space_stations(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_passenger_destination FOREIGN KEY (destination_station_id) REFERENCES space_stations(id) ON DELETE CASCADE,
  CONSTRAINT chk_ship_passenger_route CHECK (origin_station_id <> destination_station_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS station_bank_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  station_id BIGINT UNSIGNED NOT NULL,
  credits BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_station_bank_user_station (user_id, station_id),
  CONSTRAINT fk_station_bank_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_station_bank_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS station_bank_items (
  bank_id BIGINT UNSIGNED NOT NULL,
  item_code VARCHAR(40) NOT NULL,
  quantity BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (bank_id, item_code),
  CONSTRAINT fk_station_bank_item_account FOREIGN KEY (bank_id) REFERENCES station_bank_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mineral_catalog (
  code VARCHAR(40) NOT NULL,
  name VARCHAR(80) NOT NULL,
  unit_price_credits INT UNSIGNED NOT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (code)
) ENGINE=InnoDB;

INSERT INTO mineral_catalog (code,name,unit_price_credits,is_available) VALUES
  ('iron','Minério de ferro',10,1),
  ('nickel','Minério de níquel',20,1),
  ('cobalt','Minério de cobalto',30,1),
  ('ice','Gelo',5,1)
ON DUPLICATE KEY UPDATE name=VALUES(name),unit_price_credits=VALUES(unit_price_credits),is_available=VALUES(is_available);

-- Catálogo de armamentos, recarga e melhoria usados pelo terminal das estações.
INSERT INTO equipment (code, name, equipment_type, description, damage, ammo_capacity, quantity_per_purchase, price_credits, iron_cost_kg, nickel_cost_kg, cobalt_cost_kg, weight_kg)
VALUES
  ('pulse_cannon', 'Canhão de pulso', 'weapon', 'Canhão básico de energia para a nave.', 5, 90, 1, 120, 0, 0, 0, 180),
  ('plasma_cells_30', 'Cápsulas de plasma (30)', 'ammunition', 'Recarga de até 30 células de plasma.', 0, 30, 30, 30, 0, 0, 0, 0),
  ('pulse_capacitor_mk2', 'Capacitor de cerâmica MK-II', 'upgrade', 'Aumenta o dano do canhão de pulso para 10.', 5, 0, 1, 80, 0, 0, 0, 0),
  ('ion_cannon', 'Canhão de íons', 'weapon', 'Feixe concentrado de alto impacto.', 25, 90, 1, 260, 0, 0, 0, 260),
  ('heavy_plasma_cannon', 'Canhão de plasma pesado', 'weapon', 'Arma de energia pesada para alvos resistentes.', 55, 90, 1, 500, 0, 0, 0, 420),
  ('singularity_cannon', 'Canh??o de cerco de singularidade', 'weapon', 'Arma experimental de alt?ssimo impacto, fabricada com grandes reservas minerais.', 150, 30, 1, 50000, 1000, 700, 300, 700),
  ('tractor_array', 'Conjunto rebocador orbital', 'engine', 'Emissor de tracao para arrastar naves desativadas ate uma estacao.', 0, 0, 1, 12000, 250, 0, 0, 380)
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), damage=VALUES(damage), ammo_capacity=VALUES(ammo_capacity), quantity_per_purchase=VALUES(quantity_per_purchase), price_credits=VALUES(price_credits), iron_cost_kg=VALUES(iron_cost_kg), nickel_cost_kg=VALUES(nickel_cost_kg), cobalt_cost_kg=VALUES(cobalt_cost_kg), weight_kg=VALUES(weight_kg);

INSERT INTO planets (code, name, body_type, pos_x, pos_y, pos_z, radius, color, texture_key, has_rings) VALUES
  ('terra', 'Terra', 'planet', 13000, 0, -12000, 230, '#438be8', 'earth', 0),
  ('marte', 'Marte', 'planet', -19000, 0, -30000, 175, '#d86e4d', 'mars', 0),
  ('jupiter', 'Júpiter', 'planet', 32000, 0, -43000, 250, '#d4a77d', 'jupiter', 0),
  ('saturno', 'Saturno', 'planet', -41000, 0, -59000, 245, '#d8c28c', 'saturn', 1),
  ('urano', 'Urano', 'planet', 45000, 0, -72000, 210, '#85d3d4', 'uranus', 0),
  ('netuno', 'Netuno', 'planet', -26000, 0, -85000, 205, '#3974db', 'neptune', 0),
  ('sol', 'Sol', 'star', 50000, 0, 86000, 400, '#ffd878', 'sun', 0)
ON DUPLICATE KEY UPDATE name=VALUES(name), body_type=VALUES(body_type), pos_x=VALUES(pos_x), pos_y=VALUES(pos_y), pos_z=VALUES(pos_z), radius=VALUES(radius), color=VALUES(color), texture_key=VALUES(texture_key), has_rings=VALUES(has_rings);

INSERT INTO moons (planet_id, code, name, pos_x, pos_y, pos_z, radius, color, texture_key)
SELECT p.id, m.code, m.name, m.pos_x, 0, m.pos_z, m.radius, m.color, m.texture_key
FROM planets p JOIN (
  SELECT 'terra' AS parent_code, 'lua' AS code, 'Lua' AS name, 17000 AS pos_x, -15000 AS pos_z, 72 AS radius, '#b9c5d1' AS color, 'moon' AS texture_key UNION ALL
  SELECT 'marte', 'fobos', 'Fobos', -14700, -31800, 38, '#a8897c', 'rock' UNION ALL
  SELECT 'marte', 'deimos', 'Deimos', -22900, -27400, 28, '#9e8c81', 'rock' UNION ALL
  SELECT 'jupiter', 'io', 'Io', 41000, -42000, 58, '#e2c05c', 'io' UNION ALL
  SELECT 'jupiter', 'europa', 'Europa', 25000, -50000, 52, '#c8b9a3', 'moon' UNION ALL
  SELECT 'jupiter', 'ganymede', 'Ganimedes', 35000, -33000, 76, '#a89b8b', 'moon' UNION ALL
  SELECT 'jupiter', 'callisto', 'Calisto', 23000, -38000, 68, '#887e75', 'rock' UNION ALL
  SELECT 'saturno', 'tita', 'Titã', -33000, -61000, 82, '#d69a52', 'titan' UNION ALL
  SELECT 'saturno', 'encelado', 'Encélado', -48000, -65000, 42, '#d5e6e8', 'moon' UNION ALL
  SELECT 'saturno', 'iapeto', 'Japeto', -50000, -52000, 54, '#b0a18c', 'rock' UNION ALL
  SELECT 'urano', 'titania', 'Titânia', 53000, -66000, 58, '#a9a39b', 'moon' UNION ALL
  SELECT 'netuno', 'tritao', 'Tritão', -33000, -79000, 75, '#b8c5ce', 'moon'
) AS m ON m.parent_code=p.code
ON DUPLICATE KEY UPDATE planet_id=VALUES(planet_id), name=VALUES(name), pos_x=VALUES(pos_x), pos_y=VALUES(pos_y), pos_z=VALUES(pos_z), radius=VALUES(radius), color=VALUES(color), texture_key=VALUES(texture_key);

INSERT INTO space_stations (code, name, pos_x, pos_y, pos_z, radius, color, design, services) VALUES
  ('aurora', 'Porto Aurora', -3000, 0, 9000, 220, '#7bd5df', 0, JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('orbitalis', 'Orbitalis', 92000, 0, 74000, 225, '#ffbe77', 1, JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('forja', 'Forja do Cintur?o', -70000, 0, -60000, 240, '#ff687b', 2, JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('celestia', 'Celestia', -88000, 0, 82000, 230, '#ffe0a0', 3, JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('khepri', 'Estaleiro Khepri', -30000, 0, -6000, 240, '#ffa657', 4, JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('biosfera', 'Biosfera', 80000, 0, -96000, 230, '#7ee7f0', 5, JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('helios', 'Bastilha H?lios', 21000, 0, 5000, 220, '#f3b75e', 6, JSON_ARRAY('trade','weapons','ammunition')),
  ('polaris', 'Farol Polaris', 69000, 0, -32000, 200, '#c7d8ef', 7, JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('icaro', 'Ref?gio ?caro', -65000, 0, -16000, 220, '#7cebb0', 8, JSON_ARRAY('trade','weapons','ammunition')),
  ('vesper', 'Nexo V?sper', 5000, 0, -63000, 210, '#bde9fe', 9, JSON_ARRAY('trade','weapons','ammunition'))
ON DUPLICATE KEY UPDATE name=VALUES(name), pos_x=VALUES(pos_x), pos_y=VALUES(pos_y), pos_z=VALUES(pos_z), radius=VALUES(radius), color=VALUES(color), design=VALUES(design), services=VALUES(services);

INSERT INTO asteroids (code, name, pos_x, pos_y, pos_z, radius, color) VALUES
  ('asteroide_001', NULL, 50515, 0, 14325, 38, '#b2a18c'),
  ('asteroide_002', NULL, 42312, 0, 55801, 31, '#776f68'),
  ('asteroide_003', NULL, -50452, 0, -19741, 35, '#817c78'),
  ('asteroide_004', NULL, 101, 0, 46640, 18, '#817c78'),
  ('asteroide_005', NULL, -18712, 0, 65299, 43, '#b2a18c'),
  ('asteroide_006', NULL, -48909, 0, 73906, 53, '#a49a8d'),
  ('asteroide_007', NULL, -53425, 0, -7641, 32, '#817c78'),
  ('asteroide_008', NULL, 9604, 0, 58402, 35, '#b2a18c'),
  ('asteroide_009', NULL, -58891, 0, -73547, 31, '#817c78'),
  ('asteroide_010', NULL, -8032, 0, -61300, 38, '#a49a8d'),
  ('asteroide_011', NULL, -21406, 0, 16085, 28, '#93877b'),
  ('asteroide_012', NULL, 58546, 0, -17366, 50, '#817c78'),
  ('asteroide_013', NULL, -37763, 0, 85591, 36, '#b2a18c'),
  ('asteroide_014', NULL, -33169, 0, 61257, 43, '#a49a8d'),
  ('asteroide_015', NULL, -52850, 0, 4834, 52, '#b2a18c'),
  ('asteroide_016', NULL, 37685, 0, 58734, 19, '#817c78'),
  ('asteroide_017', NULL, -40848, 0, -61197, 57, '#776f68'),
  ('asteroide_018', NULL, 20008, 0, 29285, 19, '#817c78'),
  ('asteroide_019', NULL, 70144, 0, -37043, 38, '#a49a8d'),
  ('asteroide_020', NULL, 14492, 0, 56128, 20, '#776f68'),
  ('asteroide_021', NULL, -27211, 0, 80116, 22, '#93877b'),
  ('asteroide_022', NULL, -7348, 0, 34135, 51, '#93877b'),
  ('asteroide_023', NULL, -37305, 0, 60719, 54, '#817c78'),
  ('asteroide_024', NULL, -24227, 0, 58010, 24, '#b2a18c'),
  ('asteroide_025', NULL, -11943, 0, -25004, 20, '#93877b'),
  ('asteroide_026', NULL, 19704, 0, 89634, 56, '#817c78'),
  ('asteroide_027', NULL, -11258, 0, -56196, 34, '#817c78'),
  ('asteroide_028', NULL, 18584, 0, -25092, 57, '#93877b'),
  ('asteroide_029', NULL, 2602, 0, 21815, 49, '#817c78'),
  ('asteroide_030', NULL, 34618, 0, 54412, 23, '#a49a8d'),
  ('asteroide_031', NULL, 7529, 0, -38181, 31, '#93877b'),
  ('asteroide_032', NULL, -64689, 0, 10397, 22, '#817c78'),
  ('asteroide_033', NULL, 60128, 0, -48720, 24, '#817c78'),
  ('asteroide_034', NULL, 31995, 0, -18715, 38, '#817c78'),
  ('asteroide_035', NULL, 37584, 0, -71550, 19, '#817c78'),
  ('asteroide_036', NULL, 857, 0, 53537, 48, '#776f68'),
  ('asteroide_037', NULL, 38307, 0, 72707, 44, '#b2a18c'),
  ('asteroide_038', NULL, 380, 0, 30868, 48, '#776f68'),
  ('asteroide_039', NULL, 21196, 0, -69134, 49, '#b2a18c'),
  ('asteroide_040', NULL, -3347, 0, -2610, 46, '#776f68'),
  ('asteroide_041', NULL, -35246, 0, -3608, 32, '#b2a18c'),
  ('asteroide_042', NULL, 34227, 0, -120, 19, '#b2a18c'),
  ('asteroide_043', NULL, 68570, 0, 24064, 50, '#a49a8d'),
  ('asteroide_044', NULL, 42032, 0, 34562, 20, '#b2a18c'),
  ('asteroide_045', NULL, 10282, 0, -61407, 39, '#a49a8d'),
  ('asteroide_046', NULL, -24644, 0, -1381, 23, '#93877b'),
  ('asteroide_047', NULL, 71727, 0, 60203, 51, '#b2a18c'),
  ('asteroide_048', NULL, -48701, 0, -39262, 43, '#a49a8d'),
  ('asteroide_049', NULL, 15328, 0, -1501, 58, '#817c78'),
  ('asteroide_050', NULL, -9277, 0, -68946, 34, '#776f68'),
  ('asteroide_051', NULL, -51519, 0, -38675, 31, '#776f68'),
  ('asteroide_052', NULL, -43418, 0, -50831, 21, '#776f68'),
  ('asteroide_053', NULL, -73149, 0, 10248, 21, '#776f68'),
  ('asteroide_054', NULL, -17546, 0, -45348, 58, '#a49a8d'),
  ('asteroide_055', NULL, -39047, 0, -76122, 23, '#a49a8d'),
  ('asteroide_056', NULL, 3445, 0, -91754, 56, '#b2a18c'),
  ('asteroide_057', NULL, -25651, 0, 50955, 57, '#a49a8d'),
  ('asteroide_058', NULL, -54270, 0, 31442, 40, '#817c78'),
  ('asteroide_059', NULL, -81641, 0, 46597, 46, '#817c78'),
  ('asteroide_060', NULL, 14935, 0, -83592, 49, '#a49a8d'),
  ('asteroide_061', NULL, -79871, 0, 1897, 28, '#a49a8d'),
  ('asteroide_062', NULL, 67573, 0, -25400, 21, '#817c78'),
  ('asteroide_063', NULL, 67251, 0, -37304, 53, '#b2a18c'),
  ('asteroide_064', NULL, -37690, 0, 44635, 32, '#93877b'),
  ('asteroide_065', NULL, -30361, 0, -20717, 37, '#93877b'),
  ('asteroide_066', NULL, 51480, 0, 61286, 18, '#776f68'),
  ('asteroide_067', NULL, -42806, 0, 79901, 33, '#93877b'),
  ('asteroide_068', NULL, 85372, 0, 8332, 26, '#776f68'),
  ('asteroide_069', NULL, -11779, 0, -85826, 38, '#b2a18c'),
  ('asteroide_070', NULL, -10943, 0, -69871, 18, '#a49a8d'),
  ('asteroide_071', NULL, -1959, 0, -18742, 47, '#a49a8d'),
  ('asteroide_072', NULL, -57048, 0, -39894, 18, '#93877b'),
  ('asteroide_073', NULL, 29576, 0, -37458, 35, '#a49a8d'),
  ('asteroide_074', NULL, 57023, 0, 46645, 46, '#776f68'),
  ('asteroide_075', NULL, 8406, 0, -84803, 54, '#a49a8d'),
  ('asteroide_076', NULL, -45522, 0, -38468, 40, '#817c78'),
  ('asteroide_077', NULL, -58101, 0, 6574, 23, '#776f68'),
  ('asteroide_078', NULL, 9153, 0, 33412, 36, '#b2a18c'),
  ('asteroide_079', NULL, 36539, 0, 42217, 42, '#b2a18c'),
  ('asteroide_080', NULL, -33490, 0, -18737, 41, '#b2a18c'),
  ('asteroide_081', NULL, 40179, 0, -67079, 52, '#817c78'),
  ('asteroide_082', NULL, 47049, 0, 75258, 52, '#817c78'),
  ('asteroide_083', NULL, 42754, 0, -5392, 54, '#a49a8d'),
  ('asteroide_084', NULL, -15946, 0, -9285, 37, '#817c78'),
  ('asteroide_085', NULL, -24857, 0, -28099, 29, '#817c78'),
  ('asteroide_086', NULL, 16139, 0, 2590, 25, '#817c78'),
  ('asteroide_087', NULL, -16903, 0, 74535, 23, '#b2a18c'),
  ('asteroide_088', NULL, -358, 0, 22998, 42, '#817c78'),
  ('asteroide_089', NULL, -59357, 0, -32867, 44, '#b2a18c'),
  ('asteroide_090', NULL, -31888, 0, 5086, 50, '#a49a8d'),
  ('asteroide_091', NULL, -3228, 0, 44142, 54, '#817c78'),
  ('asteroide_092', NULL, 7053, 0, -79236, 31, '#817c78'),
  ('asteroide_093', NULL, 21721, 0, 48384, 49, '#93877b'),
  ('asteroide_094', NULL, -74720, 0, -45023, 54, '#776f68'),
  ('asteroide_095', NULL, 46477, 0, 51720, 57, '#93877b'),
  ('asteroide_096', NULL, 10886, 0, -9291, 20, '#817c78'),
  ('asteroide_097', NULL, 35002, 0, -6162, 31, '#817c78'),
  ('asteroide_098', NULL, -58677, 0, 13630, 37, '#817c78'),
  ('asteroide_099', NULL, 46745, 0, 36319, 18, '#a49a8d'),
  ('asteroide_100', NULL, 6663, 0, 28525, 43, '#776f68'),
  ('asteroide_101', NULL, 20433, 0, -50767, 55, '#93877b'),
  ('asteroide_102', NULL, -43905, 0, -48198, 50, '#b2a18c'),
  ('asteroide_103', NULL, -17954, 0, 1904, 35, '#a49a8d'),
  ('asteroide_104', NULL, 46228, 0, -14891, 33, '#817c78'),
  ('asteroide_105', NULL, 15247, 0, 48379, 31, '#b2a18c'),
  ('asteroide_106', NULL, -7180, 0, 61901, 45, '#817c78'),
  ('asteroide_107', NULL, -71, 0, -40723, 22, '#93877b'),
  ('asteroide_108', NULL, 50443, 0, -77038, 25, '#776f68'),
  ('asteroide_109', NULL, 11871, 0, 42228, 36, '#776f68'),
  ('asteroide_110', NULL, 77688, 0, -18019, 39, '#a49a8d'),
  ('asteroide_111', NULL, -46837, 0, 79940, 33, '#776f68'),
  ('asteroide_112', NULL, -55252, 0, 39685, 54, '#b2a18c'),
  ('asteroide_113', NULL, 10014, 0, 49560, 29, '#817c78'),
  ('asteroide_114', NULL, 33646, 0, -9061, 49, '#a49a8d'),
  ('asteroide_115', NULL, 15036, 0, 81978, 49, '#b2a18c'),
  ('asteroide_116', NULL, 78398, 0, 9055, 31, '#817c78'),
  ('asteroide_117', NULL, 1695, 0, 56086, 20, '#b2a18c'),
  ('asteroide_118', NULL, -24402, 0, 8526, 29, '#93877b'),
  ('asteroide_119', NULL, 86974, 0, 203, 49, '#b2a18c'),
  ('asteroide_120', NULL, -9452, 0, -862, 57, '#a49a8d'),
  ('asteroide_121', NULL, 72487, 0, -18410, 37, '#93877b'),
  ('asteroide_122', NULL, -38802, 0, -9959, 44, '#a49a8d'),
  ('asteroide_123', NULL, 90461, 0, -21713, 40, '#776f68'),
  ('asteroide_124', NULL, -16571, 0, 78021, 33, '#93877b'),
  ('asteroide_125', NULL, 51949, 0, -28625, 54, '#a49a8d'),
  ('asteroide_126', NULL, 19791, 0, -34896, 41, '#817c78'),
  ('asteroide_127', NULL, 62471, 0, -27278, 41, '#93877b'),
  ('asteroide_128', NULL, -5850, 0, -53788, 55, '#a49a8d'),
  ('asteroide_129', NULL, 68144, 0, -49459, 38, '#776f68'),
  ('asteroide_130', NULL, -25094, 0, -72197, 51, '#817c78'),
  ('asteroide_131', NULL, 56163, 0, 44794, 55, '#817c78'),
  ('asteroide_132', NULL, -25609, 0, 27823, 44, '#93877b'),
  ('asteroide_133', NULL, -25191, 0, -15540, 20, '#b2a18c'),
  ('asteroide_134', NULL, -67240, 0, -6883, 21, '#93877b'),
  ('asteroide_135', NULL, 26388, 0, -8797, 18, '#817c78'),
  ('asteroide_136', NULL, -33027, 0, -23435, 41, '#a49a8d'),
  ('asteroide_137', NULL, 57643, 0, -52972, 37, '#b2a18c'),
  ('asteroide_138', NULL, -66970, 0, 22762, 28, '#817c78'),
  ('asteroide_139', NULL, -22329, 0, -74068, 48, '#b2a18c'),
  ('asteroide_140', NULL, -71574, 0, 10542, 58, '#776f68'),
  ('asteroide_141', NULL, -20375, 0, -8452, 27, '#a49a8d'),
  ('asteroide_142', NULL, -52509, 0, -73968, 57, '#a49a8d'),
  ('asteroide_143', NULL, -63652, 0, 44703, 28, '#93877b'),
  ('asteroide_144', NULL, 21640, 0, -63891, 49, '#b2a18c'),
  ('asteroide_145', NULL, 51249, 0, -74134, 22, '#93877b'),
  ('asteroide_146', NULL, 50993, 0, -54068, 20, '#817c78'),
  ('asteroide_147', NULL, -6340, 0, 77823, 57, '#a49a8d'),
  ('asteroide_148', NULL, 31640, 0, -44133, 40, '#817c78'),
  ('asteroide_149', NULL, -45380, 0, -79974, 32, '#817c78'),
  ('asteroide_150', NULL, 66838, 0, -23465, 57, '#b2a18c'),
  ('asteroide_151', NULL, -36239, 0, 2683, 42, '#b2a18c'),
  ('asteroide_152', NULL, -20054, 0, -66728, 52, '#b2a18c'),
  ('asteroide_153', NULL, 85218, 0, 36235, 52, '#776f68'),
  ('asteroide_154', NULL, -47592, 0, -82154, 39, '#817c78'),
  ('asteroide_155', NULL, -7263, 0, -55198, 26, '#776f68'),
  ('asteroide_156', NULL, 48818, 0, -76803, 56, '#776f68'),
  ('asteroide_157', NULL, 10402, 0, -62384, 47, '#817c78'),
  ('asteroide_158', NULL, 55768, 0, 65234, 43, '#b2a18c'),
  ('asteroide_159', NULL, 27964, 0, -74319, 38, '#93877b'),
  ('asteroide_160', NULL, 85431, 0, -31555, 39, '#a49a8d'),
  ('asteroide_161', NULL, 9160, 0, -81533, 57, '#776f68'),
  ('asteroide_162', NULL, 46055, 0, -39338, 33, '#a49a8d'),
  ('asteroide_163', NULL, 31573, 0, 37705, 36, '#93877b'),
  ('asteroide_164', NULL, 76109, 0, -46500, 50, '#a49a8d'),
  ('asteroide_165', NULL, 35803, 0, -31386, 48, '#93877b'),
  ('asteroide_166', NULL, 35914, 0, 56439, 26, '#a49a8d'),
  ('asteroide_167', NULL, -49271, 0, -70130, 55, '#b2a18c'),
  ('asteroide_168', NULL, -14949, 0, -69361, 26, '#b2a18c'),
  ('asteroide_169', NULL, 58158, 0, -72093, 49, '#817c78'),
  ('asteroide_170', NULL, 84288, 0, -33385, 29, '#776f68'),
  ('asteroide_171', NULL, 82455, 0, 26267, 42, '#b2a18c'),
  ('asteroide_172', NULL, 5538, 0, 53152, 57, '#a49a8d'),
  ('asteroide_173', NULL, 67711, 0, 46458, 32, '#a49a8d'),
  ('asteroide_174', NULL, 48137, 0, -64575, 54, '#776f68'),
  ('asteroide_175', NULL, 80413, 0, -44965, 51, '#776f68'),
  ('asteroide_176', NULL, 70640, 0, -57009, 30, '#817c78'),
  ('asteroide_177', NULL, -4527, 0, -13470, 41, '#776f68'),
  ('asteroide_178', NULL, -4479, 0, -73234, 31, '#b2a18c'),
  ('asteroide_179', NULL, 58151, 0, 5648, 49, '#93877b'),
  ('asteroide_180', NULL, -24629, 0, 34186, 45, '#817c78'),
  ('asteroide_181', NULL, 31454, 0, -5089, 40, '#776f68'),
  ('asteroide_182', NULL, 20535, 0, 4591, 18, '#776f68'),
  ('asteroide_183', NULL, -11390, 0, 62417, 42, '#817c78'),
  ('asteroide_184', NULL, 77137, 0, -54508, 40, '#a49a8d'),
  ('asteroide_185', NULL, 70746, 0, -47324, 22, '#776f68'),
  ('asteroide_186', NULL, -34120, 0, -58736, 24, '#776f68'),
  ('asteroide_187', NULL, 53799, 0, -53039, 23, '#a49a8d'),
  ('asteroide_188', NULL, 85305, 0, -9024, 21, '#a49a8d'),
  ('asteroide_189', NULL, 25726, 0, -25911, 53, '#776f68'),
  ('asteroide_190', NULL, -39642, 0, -74895, 39, '#776f68'),
  ('asteroide_191', NULL, 40829, 0, 47635, 55, '#b2a18c'),
  ('asteroide_192', NULL, -65384, 0, 57143, 53, '#93877b'),
  ('asteroide_193', NULL, 11000, 0, -86875, 27, '#a49a8d'),
  ('asteroide_194', NULL, -69707, 0, 55675, 45, '#93877b'),
  ('asteroide_195', NULL, -58580, 0, -17411, 41, '#93877b'),
  ('asteroide_196', NULL, -76799, 0, 41229, 22, '#a49a8d'),
  ('asteroide_197', NULL, 52022, 0, 38335, 47, '#817c78'),
  ('asteroide_198', NULL, 12206, 0, 10841, 49, '#b2a18c'),
  ('asteroide_199', NULL, 17550, 0, -86587, 40, '#b2a18c'),
  ('asteroide_200', NULL, -67528, 0, 24273, 49, '#817c78')
ON DUPLICATE KEY UPDATE pos_x=VALUES(pos_x), pos_y=VALUES(pos_y), pos_z=VALUES(pos_z), radius=VALUES(radius), color=VALUES(color);

CREATE TABLE IF NOT EXISTS ship_tows (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tug_ship_id BIGINT UNSIGNED NOT NULL,
  rescued_ship_id BIGINT UNSIGNED NOT NULL,
  wreck_id BIGINT UNSIGNED NOT NULL,
  rescuer_user_id BIGINT UNSIGNED NOT NULL,
  station_id BIGINT UNSIGNED NOT NULL,
  origin_x DOUBLE NOT NULL,
  origin_z DOUBLE NOT NULL,
  destination_x DOUBLE NOT NULL,
  destination_z DOUBLE NOT NULL,
  duration_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 45,
  status ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ship_tows_wreck (wreck_id),
  KEY ix_ship_tows_active (status,started_at),
  CONSTRAINT fk_ship_tows_tug FOREIGN KEY (tug_ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_tows_rescued FOREIGN KEY (rescued_ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_tows_wreck FOREIGN KEY (wreck_id) REFERENCES ship_wrecks(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_tows_user FOREIGN KEY (rescuer_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_tows_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE
) ENGINE=InnoDB;
