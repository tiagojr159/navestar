-- Docking, station integrity, persistent station/ship interior presence, and a single copilot slot.
ALTER TABLE ships ADD COLUMN docked_station_id BIGINT UNSIGNED NULL AFTER selected_weapon_code;
ALTER TABLE ships ADD KEY ix_ships_docked_station (docked_station_id);
ALTER TABLE ships ADD CONSTRAINT fk_ships_docked_station FOREIGN KEY (docked_station_id) REFERENCES space_stations(id) ON DELETE SET NULL;
ALTER TABLE space_stations ADD COLUMN hull_hp INT UNSIGNED NOT NULL DEFAULT 1000 AFTER is_active;

CREATE TABLE IF NOT EXISTS station_occupants (
  user_id BIGINT UNSIGNED NOT NULL,
  station_id BIGINT UNSIGNED NOT NULL,
  mode ENUM('station','aboard') NOT NULL DEFAULT 'station',
  ship_id BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY ix_station_occupants_station (station_id,mode),
  CONSTRAINT fk_station_occupant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_station_occupant_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE,
  CONSTRAINT fk_station_occupant_ship FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ship_crew (
  ship_id BIGINT UNSIGNED NOT NULL,
  captain_id BIGINT UNSIGNED NOT NULL,
  copilot_id BIGINT UNSIGNED NOT NULL,
  station_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','active') NOT NULL DEFAULT 'pending',
  request_by ENUM('captain','copilot') NOT NULL DEFAULT 'captain',
  invited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ship_id),
  UNIQUE KEY uq_ship_crew_copilot (copilot_id),
  KEY ix_ship_crew_captain (captain_id,status),
  CONSTRAINT fk_ship_crew_ship FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_crew_captain FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_crew_copilot FOREIGN KEY (copilot_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_crew_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE,
  CONSTRAINT chk_ship_crew_distinct CHECK (captain_id <> copilot_id)
) ENGINE=InnoDB;
