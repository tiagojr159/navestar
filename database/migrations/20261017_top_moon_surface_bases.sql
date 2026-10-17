-- Place each base at the north pole; the extra 43 units align the landing slab with the surface.
UPDATE space_stations SET pos_x=76500,pos_y=115,pos_z=-67500,radius=180 WHERE code='luna-base';
UPDATE space_stations SET pos_x=157500,pos_y=119,pos_z=-148500,radius=180 WHERE code='ganymede-base';
UPDATE space_stations SET pos_x=-148500,pos_y=125,pos_z=-274500,radius=180 WHERE code='titan-base';
UPDATE space_stations SET pos_x=103500,pos_y=111,pos_z=-171000,radius=180 WHERE code='callisto-base';
UPDATE space_stations SET pos_x=184500,pos_y=101,pos_z=-189000,radius=180 WHERE code='io-base';
UPDATE space_stations SET pos_x=112500,pos_y=95,pos_z=-225000,radius=180 WHERE code='europa-base';
UPDATE space_stations SET pos_x=-148500,pos_y=118,pos_z=-355500,radius=180 WHERE code='triton-base';
UPDATE space_stations SET pos_x=238500,pos_y=101,pos_z=-297000,radius=180 WHERE code='titania-base';
UPDATE space_stations SET pos_x=-204300,pos_y=81,pos_z=-274500,radius=180 WHERE code='rhea-base';
UPDATE space_stations SET pos_x=220950,pos_y=87,pos_z=-304650,radius=180 WHERE code='oberon-base';
UPDATE space_stations SET pos_x=-225000,pos_y=97,pos_z=-234000,radius=180 WHERE code='iapetus-base';

UPDATE ships s
JOIN space_stations ss ON ss.id=s.docked_station_id
SET s.pos_x=ss.pos_x,s.pos_y=ss.pos_y,s.pos_z=ss.pos_z
WHERE ss.code IN ('luna-base','ganymede-base','titan-base','callisto-base','io-base','europa-base','triton-base','titania-base','rhea-base','oberon-base','iapetus-base');