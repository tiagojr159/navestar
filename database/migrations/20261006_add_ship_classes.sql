-- Execute once on existing installations. Existing ships remain explorers.
ALTER TABLE ships
  ADD COLUMN ship_class VARCHAR(24) NOT NULL DEFAULT 'explorer' AFTER ship_name,
  ADD COLUMN cargo_capacity_kg INT UNSIGNED NOT NULL DEFAULT 2000 AFTER ship_class,
  ADD COLUMN fuel_capacity_units SMALLINT UNSIGNED NOT NULL DEFAULT 1000 AFTER cargo_capacity_kg;
