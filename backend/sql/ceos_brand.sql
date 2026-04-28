CREATE DATABASE IF NOT EXISTS ceos_brand
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ceos_brand;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_email (email)
);

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  category ENUM('Camiseta', 'Sudadera', 'Pantalón', 'Accesorio', 'Chaqueta') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url LONGTEXT NOT NULL,
  images_json LONGTEXT NOT NULL,
  description TEXT NOT NULL,
  status ENUM('Activo', 'Oculto', 'Agotado', 'Proximamente') NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT INTO products (name, category, price, image_url, images_json, description, status, stock)
VALUES
  (
    'Sudadera CEOS Black',
    'Sudadera',
    49.99,
    'assets/img/ceos-hoodie.svg',
    JSON_ARRAY('assets/img/ceos-hoodie.svg', 'assets/img/ceos-hoodie-2.svg', 'assets/img/ceos-hoodie-3.svg'),
    'Sudadera negra con logo CEOS bordado. Algodón 100% orgánico.',
    'Activo',
    15
  ),
  (
    'Camiseta CEOS White',
    'Camiseta',
    24.99,
    'assets/img/ceos-tee.svg',
    JSON_ARRAY('assets/img/ceos-tee.svg', 'assets/img/ceos-tee-2.svg'),
    'Camiseta blanca de algodón con estampado serigráfico.',
    'Activo',
    30
  ),
  (
    'Gorra CEOS Trucker',
    'Accesorio',
    29.99,
    'assets/img/ceos-cap.svg',
    JSON_ARRAY('assets/img/ceos-cap.svg', 'assets/img/ceos-cap-2.svg'),
    'Gorra trucker con logo bordado en la parte frontal.',
    'Proximamente',
    0
  );
