-- Apply the new ten station silhouettes without moving the existing stations.
UPDATE space_stations SET name='Porto Aurora', color='#7bd5df', design=0 WHERE code='aurora';
UPDATE space_stations SET name='Bastilha H?lios', color='#f3b75e', design=6 WHERE code='helios';
UPDATE space_stations SET name='Estaleiro Khepri', color='#ffa657', design=4 WHERE code='khepri';
UPDATE space_stations SET name='Nexo V?sper', color='#bde9fe', design=9 WHERE code='vesper';
UPDATE space_stations SET name='Ref?gio ?caro', color='#7cebb0', design=8 WHERE code='icaro';
UPDATE space_stations SET name='Farol Polaris', color='#c7d8ef', design=7 WHERE code='polaris';
UPDATE space_stations SET name='Forja do Cintur?o', color='#ff687b', design=2 WHERE code='forja';

-- These are already in final sector coordinates (the 450,000 px scale migration ran earlier).
INSERT INTO space_stations (code, name, pos_x, pos_y, pos_z, radius, color, design, services) VALUES
  ('orbitalis', 'Orbitalis', 414000, 0, 333000, 225, '#ffbe77', 1, JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('celestia', 'Celestia', -396000, 0, 369000, 230, '#ffe0a0', 3, JSON_ARRAY('trade','weapons','ammunition','repairs')),
  ('biosfera', 'Biosfera', 360000, 0, -432000, 230, '#7ee7f0', 5, JSON_ARRAY('trade','weapons','ammunition','repairs'))
ON DUPLICATE KEY UPDATE name=VALUES(name), pos_x=VALUES(pos_x), pos_y=VALUES(pos_y), pos_z=VALUES(pos_z), radius=VALUES(radius), color=VALUES(color), design=VALUES(design), services=VALUES(services);
