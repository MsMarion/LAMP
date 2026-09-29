<?php
// DB connection + JSON header.

$host = getenv('DB_HOST') ?: 'localhost';
$db   = 'lamp_project';
$user = 'lampuser';
$pass = 'LampProject26!';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'DB connection failed',
        'detail' => $e->getMessage()
    ]);
    exit;
}

header('Content-Type: application/json');