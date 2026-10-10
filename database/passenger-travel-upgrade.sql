-- Passageiros pagantes, rotas e lotacao das naves.
-- Execute uma vez em bancos que ja possuem o schema principal.
USE nave;

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
