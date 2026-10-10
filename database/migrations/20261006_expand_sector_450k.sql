-- Amplia o setor em 4,5x e mantém a posição relativa de naves e destroços.
-- A tabela de controle torna esta migração segura para reexecução.
CREATE TABLE IF NOT EXISTS game_migrations (
  migration_key VARCHAR(100) NOT NULL PRIMARY KEY,
  migration_state ENUM('pending','applied') NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO game_migrations (migration_key,migration_state)
VALUES ('expand_sector_450k','pending');

START TRANSACTION;
UPDATE ships
SET pos_x=pos_x*4.5,pos_z=pos_z*4.5
WHERE (SELECT migration_state FROM game_migrations WHERE migration_key='expand_sector_450k')='pending';

UPDATE asteroids
SET pos_x=pos_x*4.5,pos_z=pos_z*4.5
WHERE (SELECT migration_state FROM game_migrations WHERE migration_key='expand_sector_450k')='pending';

UPDATE ship_wrecks
SET pos_x=pos_x*4.5,pos_z=pos_z*4.5
WHERE (SELECT migration_state FROM game_migrations WHERE migration_key='expand_sector_450k')='pending';

UPDATE game_migrations
SET migration_state='applied',applied_at=CURRENT_TIMESTAMP
WHERE migration_key='expand_sector_450k' AND migration_state='pending';
COMMIT;

-- Alinha catálogos persistidos ao catálogo visual do jogo.
INSERT IGNORE INTO game_migrations (migration_key,migration_state)
VALUES ('expand_sector_450k_catalog','pending');

START TRANSACTION;
UPDATE space_stations SET pos_x=pos_x*4.5,pos_z=pos_z*4.5
WHERE (SELECT migration_state FROM game_migrations WHERE migration_key='expand_sector_450k_catalog')='pending';
UPDATE planets SET pos_x=pos_x*4.5,pos_z=pos_z*4.5
WHERE (SELECT migration_state FROM game_migrations WHERE migration_key='expand_sector_450k_catalog')='pending';
UPDATE moons SET pos_x=pos_x*4.5,pos_z=pos_z*4.5
WHERE (SELECT migration_state FROM game_migrations WHERE migration_key='expand_sector_450k_catalog')='pending';
UPDATE game_migrations
SET migration_state='applied',applied_at=CURRENT_TIMESTAMP
WHERE migration_key='expand_sector_450k_catalog' AND migration_state='pending';
COMMIT;
