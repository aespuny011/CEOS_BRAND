# Backend PHP + MySQL

## Archivos principales

- `api/products.php`: endpoints CRUD para productos
- `config/database.php`: conexión PDO
- `sql/ceos_brand.sql`: creación de base, tabla y datos iniciales

## Configuración

Edita `config/database.php` y revisa estos valores:

- host
- port
- dbName
- username
- password

## Probar la API

Con servidor embebido:

```bash
cd backend
php -S 127.0.0.1:8000
```

Endpoints:

- `GET /api/products.php`
- `GET /api/products.php?id=1`
- `POST /api/products.php`
- `PUT /api/products.php?id=1`
- `DELETE /api/products.php?id=1`
