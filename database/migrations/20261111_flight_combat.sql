-- Applied automatically by the fire endpoint; also available for managed installations.
CREATE TABLE IF NOT EXISTS ship_weapon_cooldowns (
    ship_id BIGINT UNSIGNED NOT NULL,
    weapon_kind VARCHAR(16) NOT NULL,
    fired_at_ms BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (ship_id, weapon_kind)
) ENGINE=InnoDB;
