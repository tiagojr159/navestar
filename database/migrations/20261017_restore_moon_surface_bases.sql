-- Keep every lunar base on the surface of its parent moon (radius + 8 km).
-- The previous spacing multiplied this offset by the sector scale, leaving bases far above the surface.
UPDATE space_stations SET pos_x=76580,pos_y=0,pos_z=-67500,radius=180 WHERE code='luna-base';
UPDATE space_stations SET pos_x=157584,pos_y=0,pos_z=-148500,radius=180 WHERE code='ganymede-base';
UPDATE space_stations SET pos_x=-148410,pos_y=0,pos_z=-274500,radius=180 WHERE code='titan-base';
UPDATE space_stations SET pos_x=103576,pos_y=0,pos_z=-171000,radius=180 WHERE code='callisto-base';
UPDATE space_stations SET pos_x=184566,pos_y=0,pos_z=-189000,radius=180 WHERE code='io-base';
UPDATE space_stations SET pos_x=112560,pos_y=0,pos_z=-225000,radius=180 WHERE code='europa-base';
UPDATE space_stations SET pos_x=-148417,pos_y=0,pos_z=-355500,radius=180 WHERE code='triton-base';
UPDATE space_stations SET pos_x=238566,pos_y=0,pos_z=-297000,radius=180 WHERE code='titania-base';
UPDATE space_stations SET pos_x=-204254,pos_y=0,pos_z=-274500,radius=180 WHERE code='rhea-base';
UPDATE space_stations SET pos_x=221002,pos_y=0,pos_z=-304650,radius=180 WHERE code='oberon-base';
UPDATE space_stations SET pos_x=-224938,pos_y=0,pos_z=-234000,radius=180 WHERE code='iapetus-base';

-- Move ships already docked at a moon base with their base.
UPDATE ships s
JOIN space_stations ss ON ss.id=s.docked_station_id
SET s.pos_x=ss.pos_x,s.pos_y=0,s.pos_z=ss.pos_z
WHERE ss.code IN ('luna-base','ganymede-base','titan-base','callisto-base','io-base','europa-base','triton-base','titania-base','rhea-base','oberon-base','iapetus-base');
