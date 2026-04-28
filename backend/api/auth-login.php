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

    $email = mb_strtolower(trim((string) ($payload['email'] ?? '')));
    $password = (string) ($payload['password'] ?? '');

    if ($email === '' || $password === '') {
        throw new RuntimeException('Email y contraseña son obligatorios.');
    }

    $pdo = createPdo();
    $statement = $pdo->prepare(
        'SELECT id, name, email, password_hash FROM users WHERE email = :email'
    );
    $statement->execute(['email' => $email]);
    $user = $statement->fetch();

    if (!$user || !password_verify($password, (string) $user['password_hash'])) {
        jsonResponse(['message' => 'Credenciales incorrectas.'], 401);
    }

    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];

    jsonResponse([
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
    ]);
} catch (PDOException $exception) {
    jsonResponse([
        'message' => 'No se pudo iniciar sesion.',
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
