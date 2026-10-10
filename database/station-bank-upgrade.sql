-- Banco independente por usuário e estação.
USE nave;

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
