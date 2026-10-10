-- Canal WebRTC de voz contínuo para piloto e copiloto da mesma nave.
-- Execute uma vez em instalações que já possuem o schema.sql importado.
USE nave;

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
