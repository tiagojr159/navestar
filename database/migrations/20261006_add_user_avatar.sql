-- Adiciona a escolha persistente de personagem ao perfil de cada piloto.
ALTER TABLE users
  ADD COLUMN avatar_code VARCHAR(32) NOT NULL DEFAULT 'captain' AFTER password_hash;
