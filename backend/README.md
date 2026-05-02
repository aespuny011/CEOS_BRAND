# Backend Java de autenticacion

Este modulo mueve la logica de registro e inicio de sesion al backend Java usando Spring Boot, JDBC y sesiones HTTP.

## Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Configuracion

Por defecto usa MySQL:

- `CEOS_DB_URL=jdbc:mysql://127.0.0.1:3306/ceos_brand?useSSL=false&serverTimezone=UTC`
- `CEOS_DB_USERNAME=root`
- `CEOS_DB_PASSWORD=`

La base debe existir antes de arrancar el backend:

## Arranque

```bash
cd backend
mvn spring-boot:run
```

El frontend Angular queda preparado para consumir esta API en `http://localhost:8080` mediante el proxy.
