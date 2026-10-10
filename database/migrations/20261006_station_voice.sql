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
