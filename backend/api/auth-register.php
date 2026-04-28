<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/api.php';

applyCorsHeaders();
handlePreflight();
startApiSession();

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['message' => 'Metodo no permitido.'], 405);
    }

    $payload = readJsonBody();

    $name = trim((string) ($payload['name'] ?? ''));
    $email = mb_strtolower(trim((string) ($payload['email'] ?? '')));
    $password = (string) ($payload['password'] ?? '');

    if ($name === '' || $email === '' || $password === '') {
        throw new RuntimeException('Todos los campos son obligatorios.');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('El email no es valido.');
    }

    if (mb_strlen($password) < 6) {
        throw new RuntimeException('La contraseña debe tener al menos 6 caracteres.');
    }

    $pdo = createPdo();

    $exists = $pdo->prepare('SELECT id FROM users WHERE email = :email');
    $exists->execute(['email' => $email]);

    if ($exists->fetch()) {
        jsonResponse(['message' => 'Ya existe una cuenta con ese email.'], 409);
    }

    $statement = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :password_hash)'
    );

    $statement->execute([
        'name' => $name,
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);

    $userId = (int) $pdo->lastInsertId();

    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = $email;

    jsonResponse([
        'id' => $userId,
        'name' => $name,
        'email' => $email,
    ], 201);
} catch (PDOException $exception) {
    jsonResponse([
        'message' => 'No se pudo registrar el usuario.',
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
