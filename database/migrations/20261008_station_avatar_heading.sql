-- Persista a direcao do avatar para que todos os pilotos vejam a mesma pose.
ALTER TABLE station_occupants
  ADD COLUMN room_yaw DECIMAL(7,4) NOT NULL DEFAULT 0.0000 AFTER room_pos_z;
