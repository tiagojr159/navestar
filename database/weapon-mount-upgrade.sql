ALTER TABLE equipment
  ADD COLUMN weight_kg SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER cobalt_cost_kg;

ALTER TABLE ships
  ADD COLUMN selected_weapon_code VARCHAR(40) NOT NULL DEFAULT 'pulse_cannon' AFTER hull_hp;

UPDATE equipment SET weight_kg=180 WHERE code='pulse_cannon';
UPDATE equipment SET weight_kg=260 WHERE code='ion_cannon';
UPDATE equipment SET weight_kg=420 WHERE code='heavy_plasma_cannon';
UPDATE equipment SET weight_kg=700 WHERE code='singularity_cannon';
UPDATE equipment SET weight_kg=0 WHERE code IN ('plasma_cells_30','pulse_capacitor_mk2');

UPDATE ships s
JOIN ship_equipment se ON se.ship_id=s.id AND se.is_equipped=1
JOIN equipment e ON e.id=se.equipment_id
SET s.selected_weapon_code=e.code;
