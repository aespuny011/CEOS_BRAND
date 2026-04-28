# CEOS Brand

El proyecto ahora está separado en dos carpetas principales:

- `frontend/`: aplicación Angular
- `backend/`: API PHP conectada a MySQL

La app ya no usa `angular-in-memory-web-api` ni `localStorage` como persistencia principal. Los productos se leen y escriben en MySQL, para que puedas verlos y administrarlos desde phpMyAdmin.

## Estructura

- `frontend/src/app/services/product.service.ts`: cliente HTTP real contra `/api/products.php`
- `frontend/proxy.conf.json`: proxy de Angular para desarrollo
- `backend/api/products.php`: CRUD REST en PHP
- `backend/config/database.php`: conexión PDO a MySQL
- `backend/sql/ceos_brand.sql`: script para crear la base y cargar datos iniciales

## Base de datos con phpMyAdmin

1. Abre phpMyAdmin.
2. Importa el archivo `backend/sql/ceos_brand.sql`.
3. Se creará la base `ceos_brand` con la tabla `products`.
4. Ajusta las credenciales en `backend/config/database.php` si tu MySQL no usa `root` sin contraseña.

## Arranque en local

### Backend PHP

Si usas XAMPP/WAMP:

1. Sirve la carpeta `backend/` desde Apache.
2. Verifica que la API responda en una URL tipo `http://localhost/backend/api/products.php`.

Si usas el servidor embebido de PHP:

```bash
cd backend
php -S 127.0.0.1:8000
```

### Frontend Angular

```bash
cd frontend
npm install
npm start
```

El `start` de Angular ya usa `proxy.conf.json`, así que las llamadas a `/api/*` se redirigen al backend en `http://127.0.0.1:8000`.

## Nota importante

En esta sesión no pude arrancar ni validar PHP/MySQL porque este equipo no tiene instalados los comandos `php` ni `mysql`. Sí pude dejar preparada la estructura, el código del backend y el SQL de importación.
