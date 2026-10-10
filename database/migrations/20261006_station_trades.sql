-- Trocas de créditos e minério entre jogadores presentes no mesmo habitat.
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
