-- Upgrade para combate entre naves e destroços coletáveis.
USE nave;

ALTER TABLE ships
  ADD COLUMN energy_units INT UNSIGNED NOT NULL DEFAULT 0 AFTER cobalt_kg,
  ADD COLUMN hull_hp SMALLINT UNSIGNED NOT NULL DEFAULT 100 AFTER energy_units;

CREATE TABLE IF NOT EXISTS ship_wrecks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  destroyed_ship_id BIGINT UNSIGNED NOT NULL,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  pos_x DOUBLE NOT NULL,
  pos_z DOUBLE NOT NULL,
  iron_kg INT UNSIGNED NOT NULL DEFAULT 0,
  nickel_kg INT UNSIGNED NOT NULL DEFAULT 0,
  cobalt_kg INT UNSIGNED NOT NULL DEFAULT 0,
  energy_units INT UNSIGNED NOT NULL DEFAULT 0,
  claimed_by BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_ship_wreck_position (pos_x,pos_z,created_at),
  KEY ix_ship_wreck_owner (owner_user_id,created_at),
  CONSTRAINT fk_ship_wreck_ship FOREIGN KEY (destroyed_ship_id) REFERENCES ships(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_wreck_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_wreck_claimed_by FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
