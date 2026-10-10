-- Execute once on existing installations of the game database.
ALTER TABLE ships
  ADD COLUMN fuel_units DECIMAL(8,2) UNSIGNED NOT NULL DEFAULT 1000.00 AFTER energy_units;
