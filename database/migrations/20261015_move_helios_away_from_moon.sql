-- Move Bastilha Helios away from the lunar approach corridor.
-- Coordinates use the expanded 4.5x world scale.
UPDATE space_stations
SET pos_x=94500,pos_y=0,pos_z=292500
WHERE code='helios';

-- Keep ships already docked there attached to the station's new position.
UPDATE ships s
JOIN space_stations ss ON ss.id=s.docked_station_id
SET s.pos_x=ss.pos_x,s.pos_y=0,s.pos_z=ss.pos_z
WHERE ss.code='helios';
