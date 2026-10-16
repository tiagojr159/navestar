-- Add ten surface bases to the already expanded sector. Coordinates match world-catalog.php.
INSERT INTO space_stations (code,name,pos_x,pos_y,pos_z,radius,color,design,services) VALUES
  ('ganymede-base','Base Ganimedes',157878,0,-148500,180,'#9ccfc1',23,JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('titan-base','Base Titã',-148095,0,-274500,180,'#d6a05c',23,JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('callisto-base','Base Calisto',103842,0,-171000,180,'#a59dbc',23,JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('io-base','Base Io',184797,0,-189000,180,'#d98252',23,JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('europa-base','Base Europa',112770,0,-225000,180,'#91c9df',23,JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('triton-base','Base Tritão',-148126.5,0,-355500,180,'#93d2c8',23,JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('titania-base','Base Titania',238797,0,-297000,180,'#a9c58e',23,JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('rhea-base','Base Reia',-204093,0,-274500,180,'#d6a4b4',23,JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('oberon-base','Base Oberon',221184,0,-304650,180,'#9bc0a7',23,JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('iapetus-base','Base Japeto',-224721,0,-234000,180,'#c5aa78',23,JSON_ARRAY('trade','weapons','ammunition','repairs'))
ON DUPLICATE KEY UPDATE name=VALUES(name),pos_x=VALUES(pos_x),pos_y=VALUES(pos_y),pos_z=VALUES(pos_z),radius=VALUES(radius),color=VALUES(color),design=VALUES(design),services=VALUES(services);
