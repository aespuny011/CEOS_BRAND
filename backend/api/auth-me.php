<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/api.php';

applyCorsHeaders();
handlePreflight();
startApiSession();

$userId = $_SESSION['user_id'] ?? null;

if (!$userId) {
    jsonResponse(['message' => 'No hay sesion activa.'], 401);
}

jsonResponse([
    'id' => (int) $_SESSION['user_id'],
    'name' => $_SESSION['user_name'] ?? '',
    'email' => $_SESSION['user_email'] ?? '',
]);
