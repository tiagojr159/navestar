-- Catálogo de preços-base para venda de minérios às estações.
USE nave;

CREATE TABLE IF NOT EXISTS mineral_catalog (
  code VARCHAR(40) NOT NULL,
  name VARCHAR(80) NOT NULL,
  unit_price_credits INT UNSIGNED NOT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (code)
) ENGINE=InnoDB;

INSERT INTO mineral_catalog (code,name,unit_price_credits,is_available) VALUES
  ('iron','Minério de ferro',10,1),
  ('nickel','Minério de níquel',20,1),
  ('cobalt','Minério de cobalto',30,1)
ON DUPLICATE KEY UPDATE name=VALUES(name),unit_price_credits=VALUES(unit_price_credits),is_available=VALUES(is_available);
