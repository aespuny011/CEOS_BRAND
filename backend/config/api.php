<?php

declare(strict_types=1);

function startApiSession(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function applyCorsHeaders(): void
{
    $allowedOrigins = [
        'http://localhost:4200',
        'http://127.0.0.1:4200',
        'http://localhost',
        'http://127.0.0.1',
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
    }

    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json; charset=utf-8');
}

function handlePreflight(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function jsonResponse(mixed $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function readJsonBody(): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || $rawBody === '') {
        throw new RuntimeException('El cuerpo de la solicitud esta vacio.');
    }

    $payload = json_decode($rawBody, true);

    if (!is_array($payload)) {
        throw new RuntimeException('El JSON enviado no es valido.');
    }

    return $payload;
}

function requireAuth(): int
{
    $userId = $_SESSION['user_id'] ?? null;

    if (!is_int($userId) && !ctype_digit((string) $userId)) {
        jsonResponse(['message' => 'Debes iniciar sesion para continuar.'], 401);
    }

    return (int) $userId;
}
