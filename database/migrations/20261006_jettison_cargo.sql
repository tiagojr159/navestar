-- Permite contêineres de carga descartada, visíveis por uma hora no espaço.
ALTER TABLE ship_wrecks
  MODIFY COLUMN destroyed_ship_id BIGINT UNSIGNED NULL,
  ADD COLUMN drop_type ENUM('wreck','jettison') NOT NULL DEFAULT 'wreck' AFTER energy_units,
  ADD COLUMN expires_at DATETIME NULL DEFAULT NULL AFTER drop_type;
