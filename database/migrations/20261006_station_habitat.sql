-- Posições sincronizadas dos avatares no habitat da estação.
ALTER TABLE station_occupants
  ADD COLUMN room_pos_x DECIMAL(6,2) NOT NULL DEFAULT 50.00 AFTER ship_id,
  ADD COLUMN room_pos_z DECIMAL(6,2) NOT NULL DEFAULT 75.00 AFTER room_pos_x;

ALTER TABLE voice_messages
  MODIFY COLUMN channel_type ENUM('private','open','station') NOT NULL DEFAULT 'private';
