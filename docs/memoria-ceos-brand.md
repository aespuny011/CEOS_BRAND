<div class="cover">
  <div class="cover-top">
    <p>CICLO FORMATIVO DE GRADO SUPERIOR DESARROLLO DE APLICACIONES</p>
    <p>MULTIPLATAFORMA</p>
  </div>

  <div class="cover-title">
    CEOS BRAND
  </div>

  <div class="cover-data">
    <p>Nombre del alumno/a o alumnos/as: Álvaro</p>
    <p>Nombre del tutor docente</p>
    <p>EE. SS. Mª Auxiliadora</p>
    <p>SEVILLA</p>
    <p>Curso 2025-2026</p>
  </div>
</div>

# 1. ÍNDICE

1. Índice
2. Estudio del problema y análisis del sistema
   1. Introducción
   2. Funciones y rendimientos deseados
   3. Objetivos
   4. Modelado de la solución
      1. Recursos humanos
      2. Recursos hardware
      3. Recursos software
3. Ejecución del proyecto
   1. Elaboración de la documentación técnica
   2. Implementación de la aplicación y base de datos
4. Documentación del sistema
   1. Manual de instalación y configuración
   2. Manual de usuario
5. Conclusiones finales
   1. Grado de cumplimiento de los objetivos fijados
   2. Propuesta de modificaciones o ampliaciones futuras
6. Bibliografía

# 2. ESTUDIO DEL PROBLEMA Y ANÁLISIS DEL SISTEMA

## 2.1. Introducción

CEOS Brand es una aplicación web desarrollada para gestionar una tienda online de ropa. El sistema permite mostrar productos, registrar usuarios, iniciar sesión, gestionar un carrito de compra, realizar pagos mediante Stripe, crear pedidos y enviar correos electrónicos automáticos relacionados con la actividad de la tienda.

El proyecto surge como solución para una marca de ropa que necesita vender sus productos de forma organizada y profesional. En lugar de utilizar una página estática, se ha planteado una aplicación completa con frontend, backend y base de datos. Esto permite que la información de productos, usuarios, carritos, pedidos y pagos se mantenga almacenada de forma persistente.

La aplicación está dividida en dos partes principales:

- Frontend desarrollado con Angular.
- Backend desarrollado con Spring Boot y Java.

El frontend se encarga de la parte visual y de la interacción con el usuario. El backend centraliza la lógica de negocio, la seguridad, la comunicación con la base de datos, la integración con Stripe y el envío de correos electrónicos.

El sistema se ha diseñado teniendo en cuenta un uso real de una tienda online. Por ello, no solo se muestran productos, sino que también se controlan tallas, stock, estados de producto, pedidos, pagos y comunicaciones con los usuarios.

## 2.2. Funciones y rendimientos deseados

La aplicación debe permitir a los clientes realizar una compra completa desde la web, desde la visualización del catálogo hasta la confirmación del pedido. También debe permitir al administrador gestionar los productos y consultar los pedidos realizados.

Las funciones principales del sistema son las siguientes:

- Registro de usuarios mediante nombre, email y contraseña.
- Inicio y cierre de sesión.
- Gestión de perfil de usuario.
- Visualización del catálogo de productos.
- Filtrado y ordenación de productos.
- Consulta del detalle de cada producto.
- Selección de talla cuando el producto lo requiere.
- Gestión de stock general y por talla.
- Añadir productos al carrito.
- Modificar cantidades del carrito.
- Eliminar productos del carrito.
- Vaciar el carrito.
- Crear una sesión de pago con Stripe Checkout.
- Confirmar el pago realizado.
- Crear pedidos automáticamente después del pago.
- Guardar las líneas de pedido.
- Descontar stock al completar la compra.
- Enviar email de confirmación de pedido.
- Enviar email de bienvenida al registrarse.
- Enviar emails de marketing en lanzamientos o reposiciones.
- Enviar mensajes desde el formulario de contacto.
- Crear, editar y eliminar productos desde la zona de administración.
- Consultar pedidos propios como cliente.
- Consultar todos los pedidos como administrador.

En cuanto al rendimiento, se busca que la aplicación responda de forma rápida en las operaciones normales. Para ello se separa la lógica entre cliente y servidor, se usa una base de datos relacional y se ejecutan los emails de marketing de forma asíncrona para no bloquear al usuario.

El sistema también debe evitar errores importantes, como crear pedidos duplicados cuando Stripe envía más de una confirmación del mismo pago. Para ello se utiliza una tabla de control llamada `stripe_checkout_sessions`.

## 2.3. Objetivos

El objetivo general del proyecto es desarrollar una tienda online funcional para CEOS Brand, capaz de gestionar productos, usuarios, carritos, pagos, pedidos y correos electrónicos.

Los objetivos específicos son:

- Construir una interfaz clara, moderna y adaptada a una marca de ropa.
- Permitir que los usuarios puedan registrarse e iniciar sesión.
- Almacenar usuarios y contraseñas de forma segura.
- Crear un catálogo de productos con imágenes, precio, categoría, descripción, estado y stock.
- Gestionar stock por talla en productos como camisetas, sudaderas y pantalones.
- Permitir que el usuario añada productos al carrito.
- Controlar que no se puedan comprar productos sin stock.
- Integrar Stripe Checkout como pasarela de pago.
- Crear pedidos reales únicamente cuando el pago esté confirmado.
- Evitar la duplicación de pedidos en pagos procesados más de una vez.
- Enviar correos automáticos relacionados con la tienda.
- Proporcionar una zona de administración para productos y pedidos.
- Mantener toda la información principal en MySQL.
- Organizar el código por capas y dominios para facilitar el mantenimiento.

## 2.4. Modelado de la solución

### 2.4.1. Recursos humanos

Para el desarrollo y uso del sistema se identifican los siguientes perfiles:

| Perfil | Función dentro del proyecto |
| --- | --- |
| Alumno desarrollador | Análisis, diseño, programación, pruebas y documentación del proyecto. |
| Tutor docente | Seguimiento, orientación y evaluación del proyecto. |
| Usuario cliente | Persona que se registra, consulta productos y realiza compras. |
| Usuario administrador | Persona encargada de gestionar productos, stock y pedidos. |
| Servicio externo Stripe | Plataforma encargada de procesar pagos. |
| Servicio externo SMTP | Plataforma encargada de enviar correos electrónicos. |

En una empresa real, este sistema podría ampliarse con otros perfiles, como diseñador gráfico, responsable de almacén, responsable de atención al cliente o responsable de marketing. Para el alcance del proyecto, el perfil principal de desarrollo es el alumno, mientras que los usuarios finales se dividen en cliente y administrador.

### 2.4.2. Recursos hardware

Durante el desarrollo se ha utilizado un equipo local con capacidad suficiente para ejecutar el frontend, el backend y la base de datos. Las características recomendadas para trabajar cómodamente con el proyecto son:

| Recurso | Características recomendadas | Presupuesto aproximado |
| --- | --- | --- |
| Ordenador de desarrollo | Procesador Intel i5/Ryzen 5 o superior, 16 GB RAM, SSD 512 GB | 600-900 euros |
| Servidor de despliegue básico | VPS con 2 vCPU, 4 GB RAM, 80 GB SSD | 10-20 euros/mes |
| Conexión a Internet | Fibra o conexión estable para desarrollo y pruebas con Stripe | 25-40 euros/mes |
| Dispositivo móvil de pruebas | Smartphone Android/iOS para revisar diseño responsive | 150-300 euros |

Para un despliegue inicial de la tienda, bastaría con un VPS económico o una plataforma cloud que permita ejecutar el backend Java, servir el frontend Angular y conectar con una base de datos MySQL.

### 2.4.3. Recursos software

El proyecto utiliza herramientas de desarrollo y servicios externos. La mayoría son gratuitos para desarrollo, aunque algunos servicios pueden tener coste en producción.

| Software o servicio | Uso | Configuración | Presupuesto |
| --- | --- | --- | --- |
| Visual Studio Code | Editor de código | Extensiones para Java, Angular y Git | Gratuito |
| Java 17 | Ejecución del backend | JDK instalado en el equipo | Gratuito |
| Spring Boot 3.3.5 | Framework backend | Proyecto Maven | Gratuito |
| Maven | Gestión de dependencias backend | `pom.xml` | Gratuito |
| Node.js | Ejecución de herramientas frontend | Requerido por Angular | Gratuito |
| Angular 17 | Framework frontend | Proyecto en carpeta `frontend` | Gratuito |
| MySQL | Base de datos relacional | Base de datos `ceos_brand` | Gratuito |
| phpMyAdmin | Administración visual de MySQL | Opcional para revisar tablas | Gratuito |
| Stripe | Pasarela de pago | Claves `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` | Comisión por transacción |
| Gmail/SMTP | Envío de emails | Variables `CEOS_MAIL_USERNAME` y `CEOS_MAIL_PASSWORD` | Gratuito o según proveedor |
| Git | Control de versiones | Repositorio local/remoto | Gratuito |

Las variables de entorno evitan guardar claves sensibles en el código. Esto es especialmente importante para Stripe, la base de datos y el correo.

# 3. EJECUCIÓN DEL PROYECTO

## 3.1. Elaboración de la documentación técnica

La documentación técnica del proyecto se basa en la estructura real de carpetas, clases, servicios, repositorios y componentes. El sistema está separado en dos bloques principales:

```text
ceos-brand/
  frontend/
  backend/
  docs/
```

El frontend contiene la aplicación Angular. Sus elementos más importantes son:

```text
frontend/src/app/products/product-list/
frontend/src/app/products/product-detail/
frontend/src/app/pages/cart/
frontend/src/app/pages/login/
frontend/src/app/pages/register/
frontend/src/app/pages/profile/
frontend/src/app/pages/my-orders/
frontend/src/app/pages/admin-orders/
frontend/src/app/pages/contact/
frontend/src/app/services/
```

Los servicios de Angular realizan las peticiones HTTP al backend:

- `auth.service.ts`
- `product.service.ts`
- `cart.service.ts`
- `order.service.ts`
- `contact.service.ts`

El backend contiene la API REST desarrollada con Spring Boot. Está organizado por dominios:

```text
backend/src/main/java/com/ceos/brand/auth/
  auth/
  cart/
  contact/
  email/
  order/
  payment/
  product/
  config/
```

Cada dominio tiene una responsabilidad concreta:

- `auth`: registro, login, sesión, perfil y roles.
- `product`: productos, catálogo, stock y estados.
- `cart`: carrito, cantidades, tallas y checkout interno.
- `payment`: integración con Stripe.
- `order`: pedidos y líneas de pedido.
- `email`: emails automáticos.
- `contact`: formulario de contacto.
- `config`: configuración de CORS, tareas asíncronas y otros aspectos generales.

Entre los ficheros técnicos más importantes se encuentran:

```text
backend/src/main/java/com/ceos/brand/auth/auth/service/AuthService.java
backend/src/main/java/com/ceos/brand/auth/product/service/ProductService.java
backend/src/main/java/com/ceos/brand/auth/cart/service/CartService.java
backend/src/main/java/com/ceos/brand/auth/payment/service/PaymentService.java
backend/src/main/java/com/ceos/brand/auth/email/service/MarketingEmailService.java
backend/src/main/java/com/ceos/brand/auth/contact/service/ContactService.java
backend/src/main/resources/schema.sql
```

### 3.1.1. Modelo de producto

El modelo de producto representa la información principal de cada prenda:

```java
public record Product(
    Long id,
    String name,
    String category,
    BigDecimal price,
    String imageUrl,
    List<String> images,
    Map<String, Integer> sizeStock,
    String description,
    String status,
    Integer stock
) {
}
```

Este modelo permite trabajar con productos que tienen categoría, precio, imágenes, estado y stock por talla.

### 3.1.2. Modelo de carrito

El carrito se guarda mediante líneas asociadas a usuario, producto y talla. El modelo `CartItem` representa los productos que el usuario tiene pendientes de compra.

La tabla asociada es `cart_items`, cuya clave principal está formada por:

```text
user_id + product_id + size
```

Esto permite que un mismo usuario pueda tener el mismo producto en tallas diferentes.

### 3.1.3. Flujo técnico de compra

El flujo técnico completo es:

```text
Usuario añade producto al carrito
  -> se guarda en cart_items
  -> usuario pulsa Proceder con el pago
  -> PaymentService crea una sesión de Stripe
  -> se guarda stripe_checkout_sessions como PENDING
  -> el usuario paga en Stripe
  -> Stripe confirma el pago
  -> PaymentService valida el pago
  -> CartService vuelve a comprobar stock
  -> se descuenta stock
  -> se crea orders
  -> se crea order_items
  -> se vacía el carrito
  -> se envía email de confirmación
  -> stripe_checkout_sessions pasa a COMPLETED
```

Este flujo permite controlar el pago, el stock y la creación del pedido de forma ordenada.

### 3.1.4. Métodos más complejos implementados

Durante el desarrollo hubo tres métodos especialmente importantes por la lógica que concentran:

- `fulfillPaidCheckout(...)`, en `PaymentService.java`. Comprueba que el pago de Stripe esté confirmado, evita procesar dos veces la misma sesión y cambia el estado de la operación a completada o fallida.
- `checkout(...)`, en `CartService.java`. Revisa el carrito, vuelve a comprobar el stock real por talla, descuenta unidades, crea el pedido y vacía el carrito.
- `sendOrderConfirmationEmail(...)`, en `MarketingEmailService.java`. Genera y envía el correo de confirmación con los datos del pedido, los productos comprados y el importe total.

Estos métodos son los más relevantes porque unen las partes principales del sistema: pago, stock, pedido y comunicación con el usuario.

## 3.2. Implementación de la aplicación y base de datos

### 3.2.1. Implementación del frontend

El frontend está desarrollado con Angular. La navegación se organiza mediante rutas. Cada pantalla está dividida en componentes, plantillas HTML y estilos SCSS.

Las pantallas principales son:

- Inicio.
- Catálogo de productos.
- Detalle de producto.
- Carrito.
- Login.
- Registro.
- Perfil.
- Mis pedidos.
- Pedidos de administrador.
- Crear producto.
- Editar producto.
- Ayuda.
- Sobre nosotros.
- Contacto.

El catálogo permite filtrar productos, ordenar resultados, ver productos próximamente, consultar detalles y añadir al carrito. El detalle de producto permite seleccionar talla y muestra el stock por talla para el administrador.

El carrito muestra los productos seleccionados, cantidades, tallas, precio total y botón para proceder al pago.

### 3.2.2. Implementación del backend

El backend está desarrollado con Spring Boot. Se divide en controladores, servicios y repositorios.

Los controladores reciben las peticiones HTTP. Los servicios contienen la lógica de negocio. Los repositorios se comunican con MySQL mediante `JdbcTemplate`.

Ejemplos:

- `ProductController` recibe peticiones de productos.
- `ProductService` valida y transforma datos de productos.
- `ProductRepository` consulta y modifica la tabla `products`.
- `CartService` gestiona el carrito y el checkout.
- `PaymentService` se comunica con Stripe.
- `OrderRepository` crea pedidos y líneas.
- `MarketingEmailService` genera y envía emails.

### 3.2.3. Implementación de la base de datos

La base de datos se define en:

```text
backend/src/main/resources/schema.sql
```

Las tablas principales son:

| Tabla | Función |
| --- | --- |
| `users` | Guarda usuarios registrados. |
| `products` | Guarda productos, imágenes, estado y stock. |
| `cart_items` | Guarda el carrito de cada usuario. |
| `orders` | Guarda la cabecera de cada pedido. |
| `order_items` | Guarda los productos comprados en cada pedido. |
| `stripe_checkout_sessions` | Controla las sesiones de pago de Stripe. |

La tabla `products` incluye el campo `size_stock_json`, que permite guardar el stock por talla en formato JSON.

Ejemplo:

```json
{
  "S": 2,
  "M": 4,
  "L": 1,
  "XL": 0
}
```

Para pantalones se usan tallas:

```text
34, 36, 38, 40, 42, 44
```

Para camisetas y sudaderas:

```text
S, M, L, XL
```

### 3.2.4. Integración con Stripe

Stripe se utiliza como pasarela de pago. Cuando el usuario pulsa el botón de pago, el backend crea una sesión de Stripe Checkout.

El backend guarda el identificador de la sesión en la tabla `stripe_checkout_sessions`. Esto permite saber si una sesión está pendiente, procesándose, completada o fallida.

Estados:

- `PENDING`: sesión creada.
- `PROCESSING`: el backend está creando el pedido.
- `COMPLETED`: pedido creado correctamente.
- `FAILED`: fallo al crear el pedido.

Este control evita que se creen pedidos duplicados si Stripe envía dos confirmaciones.

### 3.2.5. Control del stock

El carrito no reserva stock. Esto significa que dos usuarios pueden tener la misma última unidad en el carrito al mismo tiempo.

La venta real se decide al confirmar el pago. Justo antes de crear el pedido, el backend vuelve a leer el stock actual de la base de datos. Si no hay stock suficiente, no se crea el pedido. Si hay stock, se descuenta y se crea el pedido.

Este comportamiento se controla en:

```text
CartService.checkout(...)
```

### 3.2.6. Envío de emails

El sistema envía correos mediante Spring Mail y `JavaMailSender`.

Tipos de email:

- Bienvenida al registrarse.
- Confirmación de pedido.
- Aviso de producto anunciado próximamente.
- Aviso de producto lanzado.
- Aviso de reposición de stock.
- Mensajes enviados desde el formulario de contacto.

Los emails de marketing se ejecutan de forma asíncrona con `@Async`, para que el usuario no tenga que esperar a que termine el envío.

# 4. DOCUMENTACIÓN DEL SISTEMA

## 4.1. Manual de instalación y configuración de la aplicación

### 4.1.1. Requisitos previos

Para instalar el proyecto en local se necesitan:

- Java 17.
- Maven.
- Node.js.
- Angular CLI.
- MySQL.
- Un editor de código como Visual Studio Code.
- Cuenta de Stripe para pagos.
- Cuenta SMTP o Gmail para correos.

### 4.1.2. Configuración de la base de datos

Crear una base de datos MySQL llamada:

```text
ceos_brand
```

El esquema se encuentra en:

```text
backend/src/main/resources/schema.sql
```

Spring Boot ejecuta el script de inicialización al arrancar porque en `application.properties` aparece:

```properties
spring.sql.init.mode=always
```

### 4.1.3. Variables de entorno

El backend usa variables de entorno para datos sensibles.

Base de datos:

```text
CEOS_DB_URL
CEOS_DB_USERNAME
CEOS_DB_PASSWORD
```

Stripe:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

Email:

```text
CEOS_MAIL_HOST
CEOS_MAIL_PORT
CEOS_MAIL_USERNAME
CEOS_MAIL_PASSWORD
```

Frontend:

```text
CEOS_FRONTEND_BASE_URL
```

### 4.1.4. Arranque del backend

Desde la carpeta del backend:

```bash
mvn spring-boot:run
```

El backend escucha por defecto en:

```text
http://localhost:8080
```

### 4.1.5. Arranque del frontend

Desde la carpeta del frontend:

```bash
npm install
npm start
```

El frontend se sirve normalmente en:

```text
http://localhost:4200
```

### 4.1.6. Comprobación de compilación

Para comprobar que el frontend compila:

```bash
npm run build
```

Durante el desarrollo el build se ha ejecutado correctamente. Los avisos existentes son de tamaño de algunos ficheros SCSS, pero no impiden la compilación.

## 4.2. Manual de usuario

### 4.2.1. Usuario cliente

El usuario cliente puede registrarse, iniciar sesión, navegar por el catálogo y realizar compras.

Pasos básicos:

1. Entrar en la web.
2. Registrarse o iniciar sesión.
3. Acceder al catálogo.
4. Seleccionar un producto.
5. Elegir talla si procede.
6. Añadir el producto al carrito.
7. Revisar el carrito.
8. Pulsar "Proceder con el pago".
9. Completar el pago en Stripe.
10. Volver a la web.
11. Consultar el pedido en "Mis pedidos".

Si un producto no tiene stock, el botón de compra aparece desactivado o el producto se muestra como agotado.

### 4.2.2. Usuario administrador

El administrador puede gestionar productos y pedidos.

Funciones principales:

- Crear productos.
- Editar productos.
- Eliminar productos.
- Definir categoría, precio, descripción e imágenes.
- Configurar stock general y por talla.
- Cambiar el estado del producto.
- Consultar todos los pedidos.

El administrador puede ver tallas aunque no tengan stock, para poder revisar y editar la disponibilidad.

### 4.2.3. Contacto

El usuario puede enviar un mensaje desde la página de contacto. El mensaje llega al correo oficial de CEOS Brand. Además, el email del usuario se establece como `reply-to`, para que el administrador pueda responder directamente.

### 4.2.4. Cierre de sesión

El usuario puede cerrar sesión desde el menú de usuario. Antes de cerrar sesión aparece un modal de confirmación para evitar cierres accidentales.

# 5. CONCLUSIONES FINALES

## 5.1. Grado de cumplimiento de los objetivos fijados

El proyecto cumple los objetivos principales planteados. Se ha desarrollado una tienda online funcional con registro de usuarios, catálogo, carrito, pagos, pedidos, stock por talla y envío de correos.

Se ha conseguido:

- Crear una interfaz adaptada a una marca de ropa.
- Implementar autenticación y sesiones.
- Guardar usuarios, productos, carritos y pedidos en MySQL.
- Gestionar stock general y por talla.
- Integrar Stripe Checkout.
- Crear pedidos después de pagos confirmados.
- Enviar emails automáticos.
- Crear una zona de administración.
- Documentar el funcionamiento general del sistema.

Uno de los puntos más importantes es el flujo de compra. El sistema diferencia correctamente entre carrito e intención de compra. El stock no se descuenta al añadir al carrito, sino al confirmar el pago y crear el pedido. Esto se acerca al comportamiento real de muchas tiendas online.

También se ha implementado una tabla de control de sesiones de Stripe para evitar pedidos duplicados si Stripe confirma un pago más de una vez.

## 5.2. Propuesta de modificaciones o ampliaciones futuras

Aunque el proyecto es funcional, se proponen varias mejoras futuras:

- Añadir gestión de direcciones de envío.
- Añadir estados de pedido como preparado, enviado o entregado.
- Implementar recuperación de contraseña por email.
- Añadir cupones de descuento.
- Crear un panel de estadísticas de ventas.
- Mejorar la subida de imágenes usando almacenamiento externo.
- Añadir paginación en el catálogo.
- Crear tests automáticos de frontend y backend.
- Implementar reservas temporales de stock.
- Hacer el descuento de stock de forma atómica en base de datos.
- Añadir facturas o justificantes de compra.
- Mejorar la gestión de devoluciones y cambios.

La mejora más importante a nivel técnico sería reforzar el control de stock ante pagos simultáneos. Para una tienda pequeña el flujo actual es válido, pero en producción sería recomendable bloquear la fila del producto o realizar una actualización atómica de stock.

# 6. BIBLIOGRAFÍA

- Documentación oficial de Angular: https://angular.io/docs
- Documentación oficial de Spring Boot: https://spring.io/projects/spring-boot
- Documentación oficial de Stripe: https://docs.stripe.com
- Documentación oficial de MySQL: https://dev.mysql.com/doc/
- Documentación oficial de JavaMailSender / Spring Mail: https://docs.spring.io/spring-framework/reference/integration/email.html
- Documentación oficial de Maven: https://maven.apache.org/guides/
- Documentación oficial de Node.js: https://nodejs.org
- Material del módulo Proyecto Integrado de Desarrollo de Aplicaciones Multiplataforma.
