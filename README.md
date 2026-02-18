# CEØS BRAND – SPA Angular (Proyecto Final)

Aplicación web Angular (NO standalone) para una marca de ropa llamada **CEØS BRAND**.

Cumple los requisitos técnicos del enunciado: módulos (AppModule), componentes, routing con parámetro, formulario reactivo con validaciones, servicio con inyección de dependencias, uso de HttpClient y backend simulado con **angular-in-memory-web-api**, detalle real por ID, y estados de carga/guardado + errores.

## Temática
Marca de ropa / catálogo de productos.

## Rutas disponibles
- `/` → Inicio
- `/productos` → Listado principal (catálogo)
- `/productos/:id` → Detalle de producto (ruta con parámetro)
- `/nuevo` → Crear producto (formulario reactivo)

## Funcionalidades principales
- **GET**: carga del catálogo desde el servicio (HttpClient)
- **GET por ID**: detalle real leyendo el parámetro `:id`
- **POST**: creación de nuevos productos desde formulario reactivo
- Mensajes de **Cargando…** / **Guardando…** y gestión básica de errores

## Estructura (resumen)
- `src/app/components/navbar` → componente navegación
- `src/app/pages/home` → portada
- `src/app/products/*` → listado, detalle, creación
- `src/app/services/product.service.ts` → acceso a datos (HttpClient)
- `src/app/services/in-memory-data.service.ts` → backend simulado
- `src/app/models/product.ts` → interfaz Product

## Ejecutar el proyecto
1. Instala dependencias:
   ```bash
   npm install
   ```
2. Arranca el servidor de desarrollo:
   ```bash
   npm start
   ```
3. Abre en el navegador:
   - `http://localhost:4200`

> Nota: El backend está simulado con `angular-in-memory-web-api` (no necesitas servidor real).

