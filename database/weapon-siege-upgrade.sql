ALTER TABLE equipment
  ADD COLUMN iron_cost_kg INT UNSIGNED NOT NULL DEFAULT 0 AFTER price_credits,
  ADD COLUMN nickel_cost_kg INT UNSIGNED NOT NULL DEFAULT 0 AFTER iron_cost_kg,
  ADD COLUMN cobalt_cost_kg INT UNSIGNED NOT NULL DEFAULT 0 AFTER nickel_cost_kg;

UPDATE equipment SET damage=5 WHERE code='pulse_cannon';
UPDATE equipment SET damage=5, description='Raises pulse cannon damage to 10.' WHERE code='pulse_capacitor_mk2';
UPDATE equipment SET damage=25 WHERE code='ion_cannon';
UPDATE equipment SET damage=55 WHERE code='heavy_plasma_cannon';

INSERT INTO equipment (code,name,equipment_type,description,damage,ammo_capacity,quantity_per_purchase,price_credits,iron_cost_kg,nickel_cost_kg,cobalt_cost_kg,is_available)
VALUES ('singularity_cannon','Singularity siege cannon','weapon','Experimental heavy damage weapon.',150,30,1,50000,1000,700,300,1)
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),damage=VALUES(damage),ammo_capacity=VALUES(ammo_capacity),price_credits=VALUES(price_credits),iron_cost_kg=VALUES(iron_cost_kg),nickel_cost_kg=VALUES(nickel_cost_kg),cobalt_cost_kg=VALUES(cobalt_cost_kg),is_available=1;
