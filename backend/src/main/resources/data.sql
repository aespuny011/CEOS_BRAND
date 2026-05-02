INSERT INTO products (name, category, price, image_url, images_json, description, status, stock)
SELECT 'Sudadera CEOS Black', 'Sudadera', 49.99, 'assets/img/ceos-hoodie.svg',
       '["assets/img/ceos-hoodie.svg","assets/img/ceos-hoodie.svg"]',
       'Sudadera negra con logo CEOS bordado. Algodon 100% organico.',
       'Activo', 15
WHERE NOT EXISTS (SELECT 1 FROM products);

INSERT INTO products (name, category, price, image_url, images_json, description, status, stock)
SELECT 'Camiseta CEOS White', 'Camiseta', 24.99, 'assets/img/ceos-tee.svg',
       '["assets/img/ceos-tee.svg","assets/img/ceos-tee.svg"]',
       'Camiseta blanca de algodon con estampado serigrafico.',
       'Activo', 30
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Camiseta CEOS White');

INSERT INTO products (name, category, price, image_url, images_json, description, status, stock)
SELECT 'Gorra CEOS Trucker', 'Accesorio', 29.99, 'assets/img/ceos-cap.svg',
       '["assets/img/ceos-cap.svg","assets/img/ceos-cap.svg"]',
       'Gorra trucker con logo bordado en la parte frontal.',
       'Proximamente', 0
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Gorra CEOS Trucker');
