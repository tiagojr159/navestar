-- Adds the permanent lunar outpost at the game's expanded world coordinates.
INSERT INTO space_stations (code,name,pos_x,pos_y,pos_z,radius,color,design,services)
VALUES ('luna-base','Base Lunar',76860,0,-67500,180,'#d8e3ef',23,JSON_ARRAY('trade','weapons','ammunition','repairs'))
ON DUPLICATE KEY UPDATE name=VALUES(name),pos_x=VALUES(pos_x),pos_y=VALUES(pos_y),pos_z=VALUES(pos_z),radius=VALUES(radius),color=VALUES(color),design=VALUES(design),services=VALUES(services);
