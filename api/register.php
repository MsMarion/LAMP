<?php
require 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$username  = trim($input['username'] ?? '');
$password  = $input['password'] ?? '';
$full_name = trim($input['full_name'] ?? '');

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'username and password are required']);
    exit;
}
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'password must be at least 8 characters']);
    exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT);

try {
    $stmt = $pdo->prepare(
        "INSERT INTO users (username, full_name, password_hash) VALUES (?, ?, ?)"
    );
    $stmt->execute([$username, $full_name, $hash]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'user_id' => (int)$pdo->lastInsertId(),
        'username' => $username,
        'full_name' => $full_name,
    ]);
} catch (PDOException $e) {
    if ((int)$e->errorInfo[1] === 1062) {
        http_response_code(409);
        echo json_encode(['error' => 'username already exists']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'registration failed']);
    }
}