-- Supplemental runtime tables formerly created during HTTP requests.
INSERT IGNORE INTO equipment (code,name,equipment_type,description,damage,ammo_capacity,quantity_per_purchase,price_credits,iron_cost_kg,nickel_cost_kg,cobalt_cost_kg,weight_kg)
VALUES ('tractor_array','Conjunto rebocador orbital','engine','Emissor de tracao para arrastar naves desativadas ate uma estação.',0,0,1,12000,250,0,0,380);

CREATE TABLE IF NOT EXISTS user_station_panel_layouts (
  user_id BIGINT UNSIGNED NOT NULL,
  panel_order JSON NOT NULL,
  collapsed_panels JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_station_panel_layout_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ship_rescue_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tug_ship_id BIGINT UNSIGNED NOT NULL,
  target_ship_id BIGINT UNSIGNED NOT NULL,
  tug_user_id BIGINT UNSIGNED NOT NULL,
  target_user_id BIGINT UNSIGNED NOT NULL,
  station_id BIGINT UNSIGNED NOT NULL,
  origin_x DOUBLE NOT NULL,
  origin_z DOUBLE NOT NULL,
  destination_x DOUBLE NOT NULL,
  destination_z DOUBLE NOT NULL,
  duration_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  status ENUM('pending','active','completed','declined','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL DEFAULT NULL,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY ix_ship_rescue_target (target_user_id,status,created_at),
  KEY ix_ship_rescue_tug (tug_user_id,status,created_at),
  KEY ix_ship_rescue_active (status,created_at),
  CONSTRAINT fk_ship_rescue_tug FOREIGN KEY (tug_ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_rescue_target FOREIGN KEY (target_ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_rescue_tug_user FOREIGN KEY (tug_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_rescue_target_user FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_rescue_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ship_passenger_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ship_id BIGINT UNSIGNED NOT NULL,
  passenger_id BIGINT UNSIGNED NOT NULL,
  origin_station_id BIGINT UNSIGNED NOT NULL,
  destination_station_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_passenger_requests_ship (ship_id,status,created_at),
  KEY ix_passenger_requests_user (passenger_id,status,created_at),
  CONSTRAINT fk_passenger_request_ship FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_passenger_request_user FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_passenger_request_origin FOREIGN KEY (origin_station_id) REFERENCES space_stations(id) ON DELETE CASCADE,
  CONSTRAINT fk_passenger_request_destination FOREIGN KEY (destination_station_id) REFERENCES space_stations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ship_weapon_cooldowns (
  ship_id BIGINT UNSIGNED NOT NULL,
  weapon_kind VARCHAR(16) NOT NULL,
  fired_at_ms BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (ship_id,weapon_kind)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mission_payouts (
  user_id BIGINT UNSIGNED NOT NULL,
  mission_id VARCHAR(100) NOT NULL,
  paid_credits INT UNSIGNED NOT NULL DEFAULT 0,
  delivered_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id,mission_id),
  CONSTRAINT fk_mission_payout_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_hash (token_hash),
  KEY ix_password_reset_user (user_id),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS communication_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_key VARCHAR(128) NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  recipient_id BIGINT UNSIGNED NULL,
  client_id VARCHAR(64) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_communication_sender_client (sender_id,client_id),
  KEY ix_communication_conversation (conversation_key,id),
  KEY ix_communication_recipient (recipient_id,id),
  KEY ix_communication_rate (sender_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS communication_reads (
  conversation_key VARCHAR(128) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  last_message_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (conversation_key,user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS communication_typing (
  conversation_key VARCHAR(128) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_key,user_id),
  KEY ix_communication_typing (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS communication_call_meta (
  call_id CHAR(36) NOT NULL,
  media_mode VARCHAR(8) NOT NULL DEFAULT 'voice',
  caller_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  callee_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (call_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
