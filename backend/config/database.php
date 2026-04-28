<?php

declare(strict_types=1);

function createPdo(): PDO
{
    $host = '127.0.0.1';
    $port = 3306;
    $dbName = 'ceos_brand';
    $username = 'root';
    $password = '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset={$charset}";

    return new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
