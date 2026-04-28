<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/api.php';

applyCorsHeaders();
handlePreflight();
startApiSession();

try {
    $pdo = createPdo();
    requireAuth();
    $method = $_SERVER['REQUEST_METHOD'];
    $id = isset($_GET['id']) ? (int) $_GET['id'] : null;

    switch ($method) {
        case 'GET':
            if ($id) {
                getProductById($pdo, $id);
                break;
            }

            getProducts($pdo);
            break;

        case 'POST':
            createProduct($pdo);
            break;

        case 'PUT':
            if (!$id) {
                jsonResponse(['message' => 'Falta el id del producto.'], 400);
            }

            updateProduct($pdo, $id);
            break;

        case 'DELETE':
            if (!$id) {
                jsonResponse(['message' => 'Falta el id del producto.'], 400);
            }

            deleteProduct($pdo, $id);
            break;

        default:
            jsonResponse(['message' => 'Metodo no permitido.'], 405);
    }
} catch (PDOException $exception) {
    jsonResponse([
        'message' => 'No se pudo conectar con la base de datos.',
        'error' => $exception->getMessage(),
    ], 500);
} catch (RuntimeException $exception) {
    jsonResponse(['message' => $exception->getMessage()], 400);
} catch (Throwable $exception) {
    jsonResponse([
        'message' => 'Error inesperado en el servidor.',
        'error' => $exception->getMessage(),
    ], 500);
}

function getProducts(PDO $pdo): void
{
    $sql = 'SELECT id, name, category, price, image_url, images_json, description, status, stock
            FROM products
            ORDER BY id ASC';

    $rows = $pdo->query($sql)->fetchAll();
    $products = array_map('mapProductRow', $rows);

    jsonResponse($products);
}

function getProductById(PDO $pdo, int $id): void
{
    $sql = 'SELECT id, name, category, price, image_url, images_json, description, status, stock
            FROM products
            WHERE id = :id';

    $statement = $pdo->prepare($sql);
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();

    if (!$row) {
        jsonResponse(['message' => 'Producto no encontrado.'], 404);
    }

    jsonResponse(mapProductRow($row));
}

function createProduct(PDO $pdo): void
{
    $payload = validatePayload(readJsonBody());

    $sql = 'INSERT INTO products (name, category, price, image_url, images_json, description, status, stock)
            VALUES (:name, :category, :price, :image_url, :images_json, :description, :status, :stock)';

    $statement = $pdo->prepare($sql);
    $statement->execute([
        'name' => $payload['name'],
        'category' => $payload['category'],
        'price' => $payload['price'],
        'image_url' => $payload['imageUrl'],
        'images_json' => json_encode($payload['images'], JSON_UNESCAPED_UNICODE),
        'description' => $payload['description'],
        'status' => $payload['status'],
        'stock' => $payload['stock'],
    ]);

    $payload['id'] = (int) $pdo->lastInsertId();

    jsonResponse($payload, 201);
}

function updateProduct(PDO $pdo, int $id): void
{
    $payload = validatePayload(readJsonBody());

    $exists = $pdo->prepare('SELECT id FROM products WHERE id = :id');
    $exists->execute(['id' => $id]);

    if (!$exists->fetch()) {
        jsonResponse(['message' => 'Producto no encontrado.'], 404);
    }

    $sql = 'UPDATE products
            SET name = :name,
                category = :category,
                price = :price,
                image_url = :image_url,
                images_json = :images_json,
                description = :description,
                status = :status,
                stock = :stock
            WHERE id = :id';

    $statement = $pdo->prepare($sql);
    $statement->execute([
        'id' => $id,
        'name' => $payload['name'],
        'category' => $payload['category'],
        'price' => $payload['price'],
        'image_url' => $payload['imageUrl'],
        'images_json' => json_encode($payload['images'], JSON_UNESCAPED_UNICODE),
        'description' => $payload['description'],
        'status' => $payload['status'],
        'stock' => $payload['stock'],
    ]);

    $payload['id'] = $id;

    jsonResponse($payload);
}

function deleteProduct(PDO $pdo, int $id): void
{
    $statement = $pdo->prepare('DELETE FROM products WHERE id = :id');
    $statement->execute(['id' => $id]);

    if ($statement->rowCount() === 0) {
        jsonResponse(['message' => 'Producto no encontrado.'], 404);
    }

    jsonResponse(true);
}

function validatePayload(array $payload): array
{
    $requiredFields = ['name', 'category', 'price', 'imageUrl', 'images', 'description', 'status', 'stock'];

    foreach ($requiredFields as $field) {
        if (!array_key_exists($field, $payload)) {
            throw new RuntimeException("Falta el campo obligatorio: {$field}.");
        }
    }

    $payload['name'] = trim((string) $payload['name']);
    $payload['category'] = trim((string) $payload['category']);
    $payload['description'] = trim((string) $payload['description']);
    $payload['status'] = trim((string) $payload['status']);
    $payload['imageUrl'] = trim((string) $payload['imageUrl']);
    $payload['price'] = (float) $payload['price'];
    $payload['stock'] = (int) $payload['stock'];

    if ($payload['name'] === '' || $payload['category'] === '' || $payload['description'] === '' || $payload['status'] === '') {
        throw new RuntimeException('Los campos de texto no pueden estar vacios.');
    }

    if ($payload['price'] < 0) {
        throw new RuntimeException('El precio no puede ser negativo.');
    }

    if ($payload['stock'] < 0) {
        throw new RuntimeException('El stock no puede ser negativo.');
    }

    if (!is_array($payload['images'])) {
        throw new RuntimeException('El campo images debe ser un array.');
    }

    $payload['images'] = array_values(array_map(
        static fn ($image): string => trim((string) $image),
        array_filter($payload['images'], static fn ($image): bool => trim((string) $image) !== '')
    ));

    return $payload;
}

function mapProductRow(array $row): array
{
    $images = json_decode((string) ($row['images_json'] ?? '[]'), true);

    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'category' => $row['category'],
        'price' => (float) $row['price'],
        'imageUrl' => $row['image_url'],
        'images' => is_array($images) ? $images : [],
        'description' => $row['description'],
        'status' => $row['status'],
        'stock' => (int) $row['stock'],
    ];
}
